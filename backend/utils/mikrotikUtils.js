const MikrotikUser = require('../models/MikrotikUser');
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

const reconnectMikrotikUser = async (userId) => {
  const user = await MikrotikUser.findById(userId).populate('package').populate('mikrotikRouter');

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

    if (user.serviceType === 'pppoe') {
      const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
      if (pppSecrets.length > 0) {
        const secretId = pppSecrets[0]['.id'];
        await client.write('/ppp/secret/set', [
          `=.id=${secretId}`,
          '=disabled=no',
          `=profile=${user.package.profile}`,
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

module.exports = { getMikrotikApiClient, reconnectMikrotikUser, checkRouterStatus, checkUserStatus, checkCPEStatus };
