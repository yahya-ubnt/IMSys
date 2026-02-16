
const MikrotikUser = require('../models/MikrotikUser');
const { decrypt } = require('../utils/crypto');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

const MikrotikHardwareService = {
  /**
   * Gets live traffic statistics for a user from the router.
   * @param {String} userId - The ID of the MikrotikUser.
   * @returns {Promise<Object>} - An object containing traffic data.
   */
  getUserTraffic: async (userId) => {
    const user = await MikrotikUser.findById(userId).populate('mikrotikRouter');

    if (!user) throw new Error('Mikrotik User not found');
    if (!user.mikrotikRouter) throw new Error('Associated Mikrotik Router not found');

    const router = user.mikrotikRouter;
    let client;

    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
        timeout: 5000,
      });

      await client.connect();

      let trafficData = { rxRate: 0, txRate: 0, rxBytes: 0, txBytes: 0 };

      if (user.serviceType === 'pppoe') {
        const pppActiveUsers = await client.write('/ppp/active/print', ['=.proplist=name,interface']);
        const activeUser = pppActiveUsers.find(u => u.name === user.username);
        if (activeUser) {
          const interfaceName = activeUser.interface;
          const monitor = await client.write('/interface/monitor-traffic', [`=interface=${interfaceName}`, '=once=']);
          if (monitor.length > 0) {
            trafficData.rxRate = parseInt(monitor[0]['rx-bits-per-second'], 10) / 8;
            trafficData.txRate = parseInt(monitor[0]['tx-bits-per-second'], 10) / 8;
          }
        }
      } else if (user.serviceType === 'static') {
        const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`, '=.proplist=rate,bytes']);
        if (simpleQueues.length > 0) {
          const [rxRate, txRate] = simpleQueues[0].rate.split('/');
          trafficData.rxRate = parseInt(rxRate, 10);
          trafficData.txRate = parseInt(txRate, 10);
          const [rxBytes, txBytes] = simpleQueues[0].bytes.split('/');
          trafficData.rxBytes = parseInt(rxBytes, 10);
          trafficData.txBytes = parseInt(txBytes, 10);
        }
      }

      await client.close();
      return trafficData;
    } catch (error) {
      console.error(`[MikrotikHardwareService] Could not fetch traffic for user ${userId}:`, error.message);
      // Return zeroed data but include an error flag for the frontend to interpret.
      return { rxRate: 0, txRate: 0, rxBytes: 0, txBytes: 0, error: `Could not fetch traffic: ${error.message}` };
    }
  },
};

module.exports = MikrotikHardwareService;
