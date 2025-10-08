const asyncHandler = require('express-async-handler');
const DiagnosticLog = require('../models/DiagnosticLog');
const Device = require('../models/Device');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const { pingDevice } = require('../utils/ping');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils');

// @desc    Run a bulk diagnostic check
// @route   POST /api/bulk-diagnostics
// @access  Private/Admin
const runBulkDiagnostic = asyncHandler((req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const run = async () => {
    const { deviceIds, userChecks } = req.body;
    const adminUserId = req.user._id;
    const steps = [];
    let finalStatus = 'Completed';

    sendEvent('start', { message: 'Diagnostic process started...' });

    for (const deviceId of deviceIds) {
      const initialDevice = await Device.findById(deviceId).populate('router');
      if (!initialDevice) {
        const step = {
          stepName: `Device ID ${deviceId} Not Found`,
          status: 'Failure',
          summary: 'Device not found in the database.',
        };
        steps.push(step);
        sendEvent('step', step);
        finalStatus = 'Failed';
        continue;
      }

      const deviceStatus = await pingDevice(initialDevice.ipAddress);
      const step1 = {
        stepName: `Ping Initial Device: ${initialDevice.deviceName}`,
        status: deviceStatus.status === 'UP' ? 'Success' : 'Failure',
        summary: deviceStatus.message,
      };
      steps.push(step1);
      sendEvent('step', step1);

      if (deviceStatus.status === 'UP') {
        if (initialDevice.deviceType === 'AP') {
          const stations = await Device.find({ ap: initialDevice._id }).populate('router');
          for (const station of stations) {
            const stationStatus = await pingDevice(station.ipAddress);
            const step2_station = {
              stepName: `Ping Station: ${station.deviceName}`,
              status: stationStatus.status === 'UP' ? 'Success' : 'Failure',
              summary: stationStatus.message,
            };
            steps.push(step2_station);
            sendEvent('step', step2_station);

            if (stationStatus.status === 'UP') {
              await checkUsersForDevice(station, userChecks, steps, station.router, adminUserId, sendEvent);
            }
          }
        } else if (initialDevice.deviceType === 'Station') {
          await checkUsersForDevice(initialDevice, userChecks, steps, initialDevice.router, adminUserId, sendEvent);
        }
      }
    }

    if (steps.some(step => step.status === 'Failure')) {
      finalStatus = 'Failed';
    }

    const log = await DiagnosticLog.create({
      triggeredBy: adminUserId,
      finalStatus,
      steps,
    });

    sendEvent('done', log);
  };

  run().catch(error => {
    console.error('Diagnostic Error:', error);
    sendEvent('error', { message: error.message || 'An unknown error occurred.' });
  }).finally(() => {
    res.end();
  });
});

// --- Helper Functions ---

async function checkUsersForDevice(device, userChecks, steps, router, adminUserId, sendEvent) {
  if (!userChecks || userChecks.length === 0) return;

  if (!router) {
    const step = {
      stepName: `Router for ${device.deviceName} not found`,
      status: 'Failure',
      summary: 'Router configuration missing.',
    };
    steps.push(step);
    sendEvent('step', step);
    return;
  }
  
  const routerDetails = await MikrotikRouter.findById(router._id || router);
  if (!routerDetails) {
    const step = {
        stepName: `Router details for ${router.name} not found`,
        status: 'Failure',
        summary: 'Could not retrieve router details.',
    };
    steps.push(step);
    sendEvent('step', step);
    return;
  }


  const apiClient = await getMikrotikApiClient(routerDetails);
  if (!apiClient) {
    const step = {
      stepName: `Connect to Router: ${routerDetails.name}`,
      status: 'Failure',
      summary: 'Failed to connect to the Mikrotik router.',
    };
    steps.push(step);
    sendEvent('step', step);
    return;
  }

  try {
    const users = await MikrotikUser.find({ device: device._id });
    for (const user of users) {
      if (userChecks.includes(user.username)) {
        let step;
        try {
          const [activeUser] = await apiClient.write('/ppp/active/print', [`?name=${user.username}`]);
          if (activeUser) {
            step = {
              stepName: `Check User: ${user.username}`,
              status: 'Success',
              summary: `User is active. Uptime: ${activeUser.uptime}, IP: ${activeUser['address']}`,
            };
          } else {
            step = {
              stepName: `Check User: ${user.username}`,
              status: 'Failure',
              summary: 'User is not active on the router.',
            };
          }
        } catch (err) {
          step = {
            stepName: `Check User: ${user.username}`,
            status: 'Failure',
            summary: `Error checking user status: ${err.message}`,
          };
        }
        steps.push(step);
        sendEvent('step', step);
      }
    }
  } finally {
    if (apiClient.connected) {
      apiClient.close();
    }
  }
}

module.exports = { runBulkDiagnostic };
