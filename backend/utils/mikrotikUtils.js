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

const removeHotspotIpBinding = async (router, macAddress) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    const bindings = await client.write('/ip/hotspot/ip-binding/print', [`?mac-address=${macAddress}`]);
    if (bindings.length > 0) {
      const bindingId = bindings[0]['.id'];
      await client.write('/ip/hotspot/ip-binding/remove', [`=.id=${bindingId}`]);
      console.log(`Successfully removed hotspot IP binding for ${macAddress} from router ${router.name}`);
    } else {
      console.log(`No hotspot IP binding found for ${macAddress} on router ${router.name}. Nothing to remove.`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to remove hotspot IP binding for ${macAddress} from router ${router.name}`, error);
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

const removeNetwatchScript = async (router, targetDevice) => {
  const client = await getMikrotikApiClient(router);
  if (!client) return false;

  try {
    // Find the netwatch rule for the device's IP address
    const existingNetwatch = await client.write('/tool/netwatch/print', [`?host=${targetDevice.ipAddress}`]);

    if (existingNetwatch && existingNetwatch.length > 0) {
      const netwatchId = existingNetwatch[0]['.id'];
      console.log(`Removing Netwatch for ${targetDevice.ipAddress}.`);
      await client.write('/tool/netwatch/remove', [`=.id=${netwatchId}`]);
      console.log(`Successfully removed Netwatch script for ${targetDevice.deviceName} on router ${router.name}`);
    } else {
      console.log(`No Netwatch script found for ${targetDevice.ipAddress}. Nothing to remove.`);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to remove Netwatch script for ${targetDevice.deviceName} on router ${router.name}`, error);
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

/**
 * Idempotent sync for a Mikrotik user.
 * Checks actual state on router and aligns it with DB intent.
 */
const syncMikrotikUser = async (client, user) => {
  if (user.serviceType === 'pppoe') {
    return await ensurePppSecret(client, user);
  } else if (user.serviceType === 'static') {
    return await ensureStaticLeaseAndQueue(client, user);
  }
  return false;
};

const ensurePppSecret = async (client, user) => {
  const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
  
  // Determine desired state based on user status and grace period
  let desiredProfile;
  let desiredDisabled;

  if (user.gracePeriodEnabled) {
    desiredProfile = user.package.profile; // Keep original profile during grace
    desiredDisabled = 'no'; // Keep enabled during grace
  } else {
    const isSuspended = user.status === 'suspended';
    desiredProfile = isSuspended ? 'Disconnect' : user.package.profile;
    desiredDisabled = isSuspended ? 'yes' : 'no';
  }
  
  const comment = `Synced by IMSys at ${new Date().toISOString()}`;

  const secretArgs = [
    `=name=${user.username}`,
    `=password=${user.pppoePassword}`,
    `=profile=${desiredProfile}`,
    `=service=pppoe`,
    `=disabled=${desiredDisabled}`,
    `=comment=${comment}`,
  ];
  if (user.remoteAddress) {
    secretArgs.push(`=remote-address=${user.remoteAddress}`);
  }

  try {
    if (pppSecrets.length === 0) {
      await client.write('/ppp/secret/add', secretArgs);
    } else {
      const existing = pppSecrets[0];
      const needsUpdate = 
        existing.password !== user.pppoePassword ||
        existing.profile !== desiredProfile ||
        existing.disabled !== desiredDisabled ||
        (user.remoteAddress && existing['remote-address'] !== user.remoteAddress);

      if (needsUpdate) {
        await client.write('/ppp/secret/set', [`=.id=${existing['.id']}`, ...secretArgs]);
      }
    }

    // Handle active session if user should be suspended (and not in grace period)
    if (user.status === 'suspended' && !user.gracePeriodEnabled) {
      const activeSessions = await client.write('/ppp/active/print', [`?name=${user.username}`]);
      if (activeSessions.length > 0) {
        for (const session of activeSessions) {
          await client.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`[ensurePppSecret] Error during PPP secret sync for ${user.username}:`, error);
    throw error; // Re-throw to be caught by the worker
  }
};

const ensureStaticLeaseAndQueue = async (client, user) => {
  // 1. Ensure DHCP Lease (only make static if MAC is present)
  if (user.macAddress) {
    const leases = await client.write('/ip/dhcp-server/lease/print', [`?mac-address=${user.macAddress}`]);
    const leaseArgs = [
      `=address=${user.ipAddress}`,
      `=mac-address=${user.macAddress}`,
      `=comment=IMSys: ${user.username}`,
    ];

    if (leases.length === 0) {
      console.log(`[Sync] Creating missing static DHCP lease for ${user.username}`);
      await client.write('/ip/dhcp-server/lease/add', leaseArgs);
    } else {
      const existing = leases[0];
      if (existing.address !== user.ipAddress || !existing.comment.includes('IMSys:')) {
        console.log(`[Sync] Updating static DHCP lease for ${user.username}`);
        await client.write('/ip/dhcp-server/lease/set', [`=.id=${existing['.id']}`, ...leaseArgs]);
      }
    }
  } else {
    // If no macAddress, ensure no static lease exists for this IP, as it should be dynamic
    const leases = await client.write('/ip/dhcp-server/lease/print', [`?address=${user.ipAddress}`, '?dynamic=false']);
    for (const lease of leases) {
        console.log(`[Sync] Warning: Found unexpected static lease for ${user.ipAddress} without a MAC in DB. Removing it.`);
        await client.write('/ip/dhcp-server/lease/remove', [`=.id=${lease['.id']}`]);
    }
  }

  // 2. Ensure Simple Queue
  const queues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
  const desiredLimit = user.package.rateLimit;
  const queueArgs = [
    `=name=${user.username}`,
    `=target=${user.ipAddress}`,
    `=max-limit=${desiredLimit}`,
    `=comment=IMSys: ${user.username}`,
    `=disabled=no`, // Simple queues for static users are always enabled
  ];

  if (queues.length === 0) {
    console.log(`[Sync] Creating missing Simple Queue for ${user.username}`);
    await client.write('/queue/simple/add', queueArgs);
  } else {
    const existing = queues[0];
    if (existing.target !== `${user.ipAddress}/32` || existing['max-limit'] !== desiredLimit || existing.disabled !== 'no') {
      console.log(`[Sync] Updating Simple Queue for ${user.username}`);
      await client.write('/queue/simple/set', [`=.id=${existing['.id']}`, ...queueArgs]);
    }
  }

  // 3. Ensure Firewall Address List (Walled Garden Logic)
  const listEntries = await client.write('/ip/firewall/address-list/print', [
    `?address=${user.ipAddress}`,
    `?list=ALLOWED_USERS`
  ]);

  // User is allowed if status is active OR if they are in a grace period
  const isAllowed = user.status === 'active' || user.gracePeriodEnabled;
  const currentlyInList = listEntries.length > 0;

  if (isAllowed && !currentlyInList) {
    console.log(`[Sync] Granting internet access to ${user.username} (adding to ALLOWED_USERS)`);
    await client.write('/ip/firewall/address-list/add', [
      '=list=ALLOWED_USERS',
      `=address=${user.ipAddress}`,
      `=comment=IMSys: ${user.username}`
    ]);
  } else if (!isAllowed && currentlyInList) {
    console.log(`[Sync] Revoking internet access for ${user.username} (removing from ALLOWED_USERS)`);
    for (const entry of listEntries) {
      await client.write('/ip/firewall/address-list/remove', [`=.id=${entry['.id']}`]);
    }
  }
  
  // Cleanup: Remove from the old BLOCKED_USERS list if present
  const oldBlockedEntries = await client.write('/ip/firewall/address-list/print', [
    `?address=${user.ipAddress}`,
    `?list=BLOCKED_USERS`
  ]);
  for (const entry of oldBlockedEntries) {
      console.log(`[Sync] Cleaning up old BLOCKED_USERS entry for ${user.username}`);
      await client.write('/ip/firewall/address-list/remove', [`=.id=${entry['.id']}`]);
  }

  return true;
};

const removeMikrotikUser = async (client, user) => {
  if (user.serviceType === 'static') {
    // Remove Simple Queue
    const queues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
    for (const queue of queues) {
      console.log(`[Remove] Removing Simple Queue for ${user.username}`);
      await client.write('/queue/simple/remove', [`=.id=${queue['.id']}`]);
    }

    // Remove DHCP Lease
    if (user.macAddress) {
      const leases = await client.write('/ip/dhcp-server/lease/print', [`?mac-address=${user.macAddress}`]);
      for (const lease of leases) {
        console.log(`[Remove] Removing DHCP Lease for ${user.macAddress}`);
        await client.write('/ip/dhcp-server/lease/remove', [`=.id=${lease['.id']}`]);
      }
    }

    // Remove from Firewall Address List
    if (user.ipAddress) {
      const listEntries = await client.write('/ip/firewall/address-list/print', [
        `?address=${user.ipAddress}`,
        `?list=BLOCKED_USERS`
      ]);
      for (const entry of listEntries) {
        console.log(`[Remove] Removing ${user.ipAddress} from BLOCKED_USERS`);
        await client.write('/ip/firewall/address-list/remove', [`=.id=${entry['.id']}`]);
      }
    }
  } else if (user.serviceType === 'pppoe') {
    // Remove PPP Secret
    const secrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
    for (const secret of secrets) {
      console.log(`[Remove] Removing PPP Secret for ${user.username}`);
      await client.write('/ppp/secret/remove', [`=.id=${secret['.id']}`]);
    }
    // Disconnect active session
    const activeSessions = await client.write('/ppp/active/print', [`?name=${user.username}`]);
    for (const session of activeSessions) {
      console.log(`[Remove] Terminating active session for ${user.username}`);
      await client.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
    }
  }
  return true;
};

module.exports = { getMikrotikApiClient, checkRouterStatus, checkUserStatus, checkCPEStatus, addHotspotUser, addHotspotIpBinding, removeHotspotIpBinding, removeHotspotUser, getHotspotServers, getHotspotProfiles, injectNetwatchScript, removeNetwatchScript, injectPPPProfileScripts, syncMikrotikUser, removeMikrotikUser };
