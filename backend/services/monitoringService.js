const RouterOSAPI = require('node-routeros').RouterOSAPI;
const Device = require('../models/Device');
const DowntimeLog = require('../models/DowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { sendAlert } = require('./alertingService');

const PING_INTERVAL = 5000; // 5 seconds

const handleSuccessfulPing = async (device) => {
  if (device.status === 'DOWN') {
    console.log(`Device ${device.ipAddress} is back UP.`);
    const openLog = await DowntimeLog.findOne({
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

  device.status = 'UP';
  device.lastSeen = new Date();
  await device.save();
};

const handleFailedPing = async (device) => {
  const openLog = await DowntimeLog.findOne({ device: device._id, downEndTime: null });

  if (!openLog) {
    console.log(`Device ${device.ipAddress} is DOWN. Creating new downtime log.`);
    await DowntimeLog.create({
      device: device._id,
      downStartTime: new Date(),
    });
    sendAlert(device, 'DOWN');
  }

  device.status = 'DOWN';
  await device.save();
};

const pingDevice = async (device) => {
  let client;
  try {
    const router = await MikrotikRouter.findById(device.router);
    if (!router) {
      throw new Error(`Router with ID ${device.router} not found for device ${device.ipAddress}`);
    }

    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: router.apiPort,
      timeout: 4000, // Shorter timeout for ping
    });

    await client.connect();
    const response = await client.write('/ping', [`=address=${device.ipAddress}`, '=count=1']);
    
    // node-routeros returns an array of objects. We need to check if any of them indicate a received packet.
    if (response && response.some(r => r.received && parseInt(r.received, 10) > 0)) {
      await handleSuccessfulPing(device);
    } else {
      await handleFailedPing(device);
    }
  } catch (error) {
    console.error(`Error pinging ${device.ipAddress}:`, error.message);
    await handleFailedPing(device);
  } finally {
    if (client && client.connected) {
      client.close();
    }
  }
};

const checkAllDevices = async () => {
  const devices = await Device.find({});
  if (devices.length > 0) {
    console.log(`Pinging ${devices.length} devices...`);
    await Promise.all(devices.map(pingDevice));
  }
};

const startMonitoring = () => {
  console.log('Starting CPE & AP monitoring service...');
  setInterval(checkAllDevices, PING_INTERVAL);
};

module.exports = { startMonitoring };
