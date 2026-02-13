const MikrotikUser = require('../models/MikrotikUser');
const HotspotUser = require('../models/HotspotUser');
const Voucher = require('../models/Voucher');
const MikrotikRouter = require('../models/MikrotikRouter');
const Package = require('../models/Package');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const { decrypt } = require('../utils/crypto.js');

const formatUpdateArgs = (argsObject) => {
  return Object.entries(argsObject).map(([key, value]) => `=${key}=${value}`);
};

const getMikrotikApiClient = async (router) => {
  const client = new RouterOSAPI({
    host: router.ipAddress,
    user: router.apiUsername,
    password: decrypt(router.apiPassword),
    port: router.apiPort,
    timeout: 3000,
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error(`Failed to connect to Mikrotik router: ${router.name}`, error);
    return null;
  }
};

const addHotspotUser = async (router, userData) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    await client.write('/ip/hotspot/user/add', [
      `=name=${userData.username}`,
      `=password=${userData.password}`,
      `=server=${userData.server}`,
      `=profile=${userData.profile}`,
      `=limit-uptime=${userData.timeLimit}`,
      `=limit-bytes-total=${userData.dataLimit}`,
    ]);
    return true;
  } catch (error) {
    console.error(`Failed to add hotspot user ${userData.username} to router ${router.name}`, error);
    return false;
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const addHotspotIpBinding = async (router, macAddress, server) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    await client.write('/ip/hotspot/ip-binding/add', [
      `=mac-address=${macAddress}`,
      `=server=${server}`,
      '=type=bypassed',
    ]);
    return true;
  } catch (error) {
    console.error(`Failed to add hotspot IP binding for ${macAddress} to router ${router.name}`, error);
    return false;
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const removeHotspotUser = async (router, username) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    const users = await client.write('/ip/hotspot/user/print', [`?name=${username}`]);
    if (users.length > 0) {
      const userId = users[0]['.id'];
      await client.write('/ip/hotspot/user/remove', [`=.id=${userId}`]);
    }
    return true;
  } catch (error) {
    console.error(`Failed to remove hotspot user ${username} from router ${router.name}`, error);
    return false;
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const getHotspotServers = async (router) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return [];

  try {
    const servers = await client.write('/ip/hotspot/print');
    return servers.map(server => server.name);
  } catch (error) {
    console.error(`Failed to get hotspot servers from router ${router.name}`, error);
    return [];
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const getHotspotProfiles = async (router) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return [];

  try {
    const profiles = await client.write('/ip/hotspot/user/profile/print');
    return profiles.map(profile => profile.name);
  } catch (error) {
    console.error(`Failed to get hotspot profiles from router ${router.name}`, error);
    return [];
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const checkRouterStatus = async (router) => {
  let isOnline = false;
  let client = null;
  try {
    client = await getMikrotikApiClient(router);
    if (client) {
      isOnline = true;
    }
  } catch (error) {
    isOnline = false;
  } finally {
    if (client && client.connected) {
      client.close();
    }
  }
  return isOnline;
};

const checkUserStatus = async (user, router) => {
    let isOnline = false;
    const client = await getMikrotikApiClient(router);

    if (!client) return false;

    try {
        if (user.serviceType === 'pppoe') {
            const pppActive = await client.write('/ppp/active/print');
            isOnline = pppActive.some(session => session.name === user.username);
        } else if (user.serviceType === 'static' && user.ipAddress) {
            const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']);
            isOnline = pingReplies.some(reply => reply.status !== 'timeout');
        }
    } catch (error) {
        isOnline = false;
    } finally {
        if (client.connected) {
            client.close();
        }
    }
    return isOnline;
};

const checkCPEStatus = async (device, router) => {
    let isOnline = false;
    const client = await getMikrotikApiClient(router);

    if (!client) return false;

    try {
        const response = await client.write('/ping', [`=address=${device.ipAddress}`, '=count=1']);
        if (response && response.length > 0 && response[0].received > 0) {
            isOnline = true;
        }
    } catch (error) {
        isOnline = false;
    } finally {
        if (client.connected) {
            client.close();
        }
    }
    return isOnline;
};

const reconnectMikrotikUser = async (userId, tenantId) => {
  const user = await MikrotikUser.findOne({ _id: userId, tenant: tenantId }).populate('package').populate('mikrotikRouter');

  if (!user) {
    console.error(`User with ID ${userId} not found for reconnection.`);
    return false;
  }

  const router = user.mikrotikRouter;
  if (!router) {
    console.error(`Mikrotik router not found for user ${user.username}.`);
    return false;
  }

  let client;
  try {
    client = await getMikrotikApiClient(router);
    if (!client) return false;

    const comment = `Reconnected: Payment received. [${new Date().toISOString()}]`;

    if (user.serviceType === 'pppoe') {
      const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
      if (pppSecrets.length > 0) {
        const secretId = pppSecrets[0]['.id'];
        await client.write('/ppp/secret/set', [
          `=.id=${secretId}`,
          '=disabled=no',
          `=profile=${user.package.profile}`,
          `=comment=${comment}`,
        ]);
        console.log(`Successfully reconnected user ${user.username}`);
        return true;
      } else {
        console.error(`PPP Secret for user ${user.username} not found on Mikrotik.`);
        return false;
      }
    } else if (user.serviceType === 'static') {
      const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
      if (simpleQueues.length > 0) {
        const queueId = simpleQueues[0]['.id'];
        const selectedPackage = user.package; // user.package is already populated

        const updateArgs = {
          name: user.username,
          target: user.ipAddress,
          'max-limit': selectedPackage.rateLimit,
          disabled: 'no', // Enable the queue
          comment: comment,
        };

        await client.write('/queue/simple/set', [`=.id=${queueId}`, ...formatUpdateArgs(updateArgs)]);
        console.log(`Successfully reconnected static user ${user.username} by enabling simple queue.`);
        return true;
      } else {
        console.error(`Simple Queue for static user ${user.username} not found on Mikrotik. Cannot reconnect.`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Mikrotik API reconnection error for user ${user.username}: ${error.message}`);
    return false;
  } finally {
    if (client && client.connected) {
      client.close();
    }
  }
};

const injectNetwatchScript = async (router, targetDevice) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    const webhookUrl = `http://${process.env.BACKEND_IP_ADDRESS}:${process.env.PORT}/api/webhooks/network-event`;
    const apiKey = process.env.WEBHOOK_API_KEY;
    const deviceId = targetDevice._id;

    const onUpScript = `/tool fetch url="${webhookUrl}?deviceId=${deviceId}&status=up&apiKey=${apiKey}" keep-result=no`;
    const onDownScript = `/tool fetch url="${webhookUrl}?deviceId=${deviceId}&status=down&apiKey=${apiKey}" keep-result=no`;

    // Check if a netwatch for this host already exists
    const existingNetwatch = await client.write('/tool/netwatch/print', [`?host=${targetDevice.ipAddress}`]);

    if (existingNetwatch && existingNetwatch.length > 0) {
      const netwatchId = existingNetwatch[0]['.id'];
      console.log(`Netwatch for ${targetDevice.ipAddress} already exists. Updating scripts.`);
      await client.write('/tool/netwatch/set', [
        `=.id=${netwatchId}`,
        `=on-up=${onUpScript}`,
        `=on-down=${onDownScript}`,
        `=comment=IMSys Monitor: ${targetDevice.deviceName}`,
      ]);
    } else {
      console.log(`Creating new Netwatch for ${targetDevice.ipAddress}.`);
      await client.write('/tool/netwatch/add', [
        `=host=${targetDevice.ipAddress}`,
        `=on-up=${onUpScript}`,
        `=on-down=${onDownScript}`,
        `=comment=IMSys Monitor: ${targetDevice.deviceName}`,
      ]);
    }
    
    console.log(`Successfully injected Netwatch script for ${targetDevice.deviceName} on router ${router.name}`);
    return true;
  } catch (error) {
    console.error(`Failed to inject Netwatch script for ${targetDevice.deviceName} on router ${router.name}`, error);
    return false;
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

const injectPPPProfileScripts = async (router) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    const webhookUrl = `http://${process.env.BACKEND_IP_ADDRESS}:${process.env.PORT}/api/webhooks/network-event`;
    const apiKey = process.env.WEBHOOK_API_KEY;

    // We target the 'default' and 'default-encryption' profiles usually used for PPPoE
    const profilesToHeal = ['default', 'default-encryption'];

    for (const profileName of profilesToHeal) {
      // MikroTik scripts for PPP profiles use $user variable
      const onUpScript = `/tool fetch url="${webhookUrl}?username=$user&status=up&apiKey=${apiKey}" keep-result=no`;
      const onDownScript = `/tool fetch url="${webhookUrl}?username=$user&status=down&apiKey=${apiKey}" keep-result=no`;

      const existingProfiles = await client.write('/ppp/profile/print', [`?name=${profileName}`]);
      
      if (existingProfiles && existingProfiles.length > 0) {
        const profileId = existingProfiles[0]['.id'];
        await client.write('/ppp/profile/set', [
          `=.id=${profileId}`,
          `=on-up=${onUpScript}`,
          `=on-down=${onDownScript}`,
          `=comment=Healed by IMSys at ${new Date().toISOString()}`,
        ]);
        console.log(`Successfully healed PPP profile ${profileName} on router ${router.name}`);
      }
    }
    return true;
  } catch (error) {
    console.error(`Failed to heal PPP profiles on router ${router.name}`, error);
    return false;
  } finally {
    if (client.connected) {
      client.close();
    }
  }
};

module.exports = { getMikrotikApiClient, reconnectMikrotikUser, checkRouterStatus, checkUserStatus, checkCPEStatus, addHotspotUser, addHotspotIpBinding, removeHotspotUser, getHotspotServers, getHotspotProfiles, injectNetwatchScript, injectPPPProfileScripts };
