const RouterOSAPI = require('node-routeros').RouterOSAPI;
const Device = require('../models/Device');
const DowntimeLog = require('../models/DowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { sendConsolidatedAlert } = require('./alertingService');
const User = require('../models/User'); // Import User model

const PING_INTERVAL = 5000; // 5 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const handleSuccessfulPing = async (device, devicesUp) => {
  if (device.status === 'DOWN') {
    console.log(`Device ${device.ipAddress} is back UP.`);
    const openLog = await DowntimeLog.findOne({
      tenantOwner: device.tenantOwner,
      device: device._id,
      downEndTime: null,
    }).sort({ downStartTime: -1 });

    if (openLog) {
      openLog.downEndTime = new Date();
      openLog.durationSeconds = Math.round((openLog.downEndTime - openLog.downStartTime) / 1000);
      await openLog.save();
      devicesUp.push(device);
    }
  }

  await Device.updateOne({ _id: device._id }, { $set: { status: 'UP', lastSeen: new Date() } });
};

const handleFailedPing = async (device, devicesDown) => {
  const openLog = await DowntimeLog.findOne({ tenantOwner: device.tenantOwner, device: device._id, downEndTime: null });

  if (!openLog) {
    console.log(`Device ${device.ipAddress} is DOWN. Creating new downtime log.`);
    await DowntimeLog.create({
      tenantOwner: device.tenantOwner,
      device: device._id,
      downStartTime: new Date(),
    });
    devicesDown.push(device);
  }

  await Device.updateOne({ _id: device._id }, { $set: { status: 'DOWN' } });
};

const checkAllDevices = async (tenantOwner) => {
  const devices = await Device.find({ tenantOwner }).populate('router').populate('tenantOwner');
  if (devices.length === 0) {
    return;
  }

  console.log(`Pinging ${devices.length} devices for tenant ${tenantOwner}...`);

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
      const devicesUp = []; // Array to collect devices that come online
      const devicesDown = []; // Array to collect devices that go offline

      const pingPromises = routerDevices.map(async (device) => {
        try {
          const response = await client.write('/ping', [`=address=${device.ipAddress}`, '=count=1']);
          if (response && response.some(r => r.received && parseInt(r.received, 10) > 0)) {
            await handleSuccessfulPing(device, devicesUp);
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

      // Send consolidated alert for devices that came online
      if (devicesUp.length > 0) {
        await sendConsolidatedAlert(devicesUp, 'UP', tenantOwner, null, 'Device');
      }

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
          await handleFailedPing(device, devicesDown);
        }
      }

      // Send consolidated alert for devices that went offline
      if (devicesDown.length > 0) {
        await sendConsolidatedAlert(devicesDown, 'DOWN', tenantOwner, null, 'Device');
      }

    } catch (error) {
      console.error(`Failed to connect to router ${router.name}:`, error.message);
      const devicesDownRouterUnreachable = [];
      for (const device of routerDevices) {
        if (device.status === 'UP') {
          await Device.updateOne({ _id: device._id }, { $set: { status: 'DOWN' } });
          await DowntimeLog.create({
            tenantOwner: device.tenantOwner,
            device: device._id,
            downStartTime: new Date(),
          });
          devicesDownRouterUnreachable.push(device);
        }
      }
      if (devicesDownRouterUnreachable.length > 0) {
        await sendConsolidatedAlert(devicesDownRouterUnreachable, 'DOWN (Router Unreachable)', tenantOwner, null, 'Device');
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
  // This will be triggered by the master scheduler now
  // setInterval(checkAllDevices, PING_INTERVAL);
};

module.exports = { startMonitoring, checkAllDevices };