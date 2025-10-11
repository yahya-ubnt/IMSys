const RouterOSAPI = require('node-routeros').RouterOSAPI;
const Device = require('../models/Device');
const DowntimeLog = require('../models/DowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { sendAlert } = require('./alertingService');

const PING_INTERVAL = 5000; // 5 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const handleSuccessfulPing = async (device) => {
  if (device.status === 'DOWN') {
    console.log(`Device ${device.ipAddress} is back UP.`);
    const openLog = await DowntimeLog.findOne({
      user: device.user,
      device: device._id,
      downEndTime: null,
    }).sort({ downStartTime: -1 });

    if (openLog) {
      openLog.downEndTime = new Date();
      openLog.durationSeconds = Math.round((openLog.downEndTime - openLog.downStartTime) / 1000);
      await openLog.save();
      sendAlert(device, 'UP');
    }
  }

  await Device.updateOne({ _id: device._id }, { $set: { status: 'UP', lastSeen: new Date() } });
};

const handleFailedPing = async (device) => {
  const openLog = await DowntimeLog.findOne({ user: device.user, device: device._id, downEndTime: null });

  if (!openLog) {
    console.log(`Device ${device.ipAddress} is DOWN. Creating new downtime log.`);
    await DowntimeLog.create({
      user: device.user,
      device: device._id,
      downStartTime: new Date(),
    });
    sendAlert(device, 'DOWN');
  }

  await Device.updateOne({ _id: device._id }, { $set: { status: 'DOWN' } });
};

const checkAllDevices = async () => {
  const devices = await Device.find({}).populate('router');
  if (devices.length === 0) {
    return;
  }

  console.log(`Pinging ${devices.length} devices...`);

  const devicesByRouter = devices.reduce((acc, device) => {
    if (device.router) {
      const routerId = device.router._id.toString();
      if (!acc[routerId]) {
        acc[routerId] = {
          router: device.router,
          devices: [],
        };
      }
      acc[routerId].devices.push(device);
    }
    return acc;
  }, {});

  for (const routerId in devicesByRouter) {
    const { router, devices: routerDevices } = devicesByRouter[routerId];

    let client;
    try {
      client = new RouterOSAPI({
        host: router.ipAddress,
        user: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: router.apiPort,
        timeout: 4000,
      });

      await client.connect();

      const potentiallyOfflineDevices = [];

      const pingPromises = routerDevices.map(async (device) => {
        try {
          const response = await client.write('/ping', [`=address=${device.ipAddress}`, '=count=1']);
          if (response && response.some(r => r.received && parseInt(r.received, 10) > 0)) {
            await handleSuccessfulPing(device);
          } else {
            if (device.status === 'UP') {
              potentiallyOfflineDevices.push(device);
            }
          }
        } catch (error) {
          console.error(`Error pinging ${device.ipAddress}:`, error.message);
          if (device.status === 'UP') {
            potentiallyOfflineDevices.push(device);
          }
        }
      });

      await Promise.all(pingPromises);

      for (const device of potentiallyOfflineDevices) {
        let isStillDown = true;
        for (let i = 0; i < RETRY_ATTEMPTS; i++) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          try {
            const response = await client.write('/ping', [`=address=${device.ipAddress}`, '=count=1']);
            if (response && response.some(r => r.received && parseInt(r.received, 10) > 0)) {
              isStillDown = false;
              break;
            }
          } catch (error) {
            console.error(`Retry ping failed for ${device.ipAddress}:`, error.message);
          }
        }

        if (isStillDown) {
          await handleFailedPing(device);
        }
      }

    } catch (error) {
      console.error(`Failed to connect to router ${router.name}:`, error.message);
      for (const device of routerDevices) {
        await handleFailedPing(device);
      }
    } finally {
      if (client && client.connected) {
        client.close();
      }
    }
  }
};

const startMonitoring = () => {
  console.log('Starting CPE & AP monitoring service...');
  setInterval(checkAllDevices, PING_INTERVAL);
};

module.exports = { startMonitoring };