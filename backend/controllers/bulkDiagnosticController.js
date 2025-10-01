const asyncHandler = require('express-async-handler');
const Device = require('../models/Device');
const MikrotikUser = require('../models/MikrotikUser');
const DiagnosticLog = require('../models/DiagnosticLog');
const { checkCPEStatus, checkUserStatus } = require('../utils/mikrotikUtils');

// --- Main Diagnostic Function ---
const runBulkDiagnostic = asyncHandler(async (req, res) => {
  const { deviceId, userId } = req.body;
  const adminUserId = req.user._id;

  if (!deviceId) {
    res.status(400).send('Device ID is required');
    return;
  }

  const initialDevice = await Device.findById(deviceId).populate('router');
  if (!initialDevice) {
    res.status(404).send('Initial device not found');
    return;
  }
  
  let targetUser = null;
  if (userId) {
      targetUser = await MikrotikUser.findById(userId);
  }

  const steps = [];
  const deviceChecks = [];
  const userChecks = [];

  // Step 1: Check the initial device
  const initialDeviceStatus = await checkDeviceStatus(initialDevice);
  deviceChecks.push(initialDeviceStatus);
  steps.push({
    stepName: `Ping Initial Device: ${initialDevice.deviceName}`,
    status: initialDeviceStatus.status === 'UP' ? 'Success' : 'Failure',
    summary: initialDeviceStatus.message,
  });

  // Step 2: Check connected devices and users if initial device is UP
  if (initialDeviceStatus.status === 'UP') {
    if (initialDevice.deviceType === 'Access') {
      const stations = await Device.find({ deviceType: 'Station', ssid: initialDevice.ssid }).populate('router');
      steps.push({ stepName: 'AP Detected', status: 'Success', summary: `Found ${stations.length} station(s) connected to ${initialDevice.deviceName}.` });
      for (const station of stations) {
        const stationStatus = await checkDeviceStatus(station);
        deviceChecks.push(stationStatus);
        steps.push({
          stepName: `Ping Station: ${station.deviceName}`,
          status: stationStatus.status === 'UP' ? 'Success' : 'Failure',
          summary: stationStatus.message,
        });
        if (stationStatus.status === 'UP') {
          await checkUsersForDevice(station, userChecks, steps, station.router);
        }
      }
    } else if (initialDevice.deviceType === 'Station') {
      await checkUsersForDevice(initialDevice, userChecks, steps, initialDevice.router);
    }
  }

  // Step 3: Generate the final, intelligent conclusion
  const finalConclusion = generateFinalConclusion(targetUser, initialDevice, deviceChecks, userChecks);
  
  const log = await DiagnosticLog.create({
    user: adminUserId,
    targetEntity: targetUser ? targetUser.officialName : initialDevice.deviceName,
    targetEntityType: targetUser ? 'User' : 'Device',
    finalConclusion,
    steps,
  });

  res.status(201).json(log);
});

// --- Helper Functions ---
const checkDeviceStatus = async (device) => {
  const isUp = await checkCPEStatus(device, device.router);
  return {
    deviceId: device._id.toString(),
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    ipAddress: device.ipAddress,
    status: isUp ? 'UP' : 'DOWN',
    message: isUp ? `Device is reachable.` : `Device is unreachable (ping failed).`,
  };
};

const checkUsersForDevice = async (station, userChecks, steps, router) => {
  const users = await MikrotikUser.find({ station: station._id }).populate('package');
  steps.push({ stepName: `User Query for ${station.deviceName}`, status: 'Success', summary: `Found ${users.length} user(s) associated with this station.` });
  for (const user of users) {
    const isOnline = await checkUserStatus(user, router);
    userChecks.push({
      userId: user._id.toString(),
      username: user.username,
      officialName: user.officialName,
      station: station.deviceName,
      isOnline: isOnline,
    });
    steps.push({
      stepName: `User Status: ${user.officialName}`,
      status: isOnline ? 'Success' : 'Warning',
      summary: isOnline ? 'User is online and active.' : 'User is offline.',
    });
  }
};

const generateFinalConclusion = (targetUser, initialDevice, deviceChecks, userChecks) => {
    const onlineUsers = userChecks.filter(u => u.isOnline);
    const offlineUsers = userChecks.filter(u => !u.isOnline);
    const offlineDevices = deviceChecks.filter(d => d.status === 'DOWN');

    // Priority 1: Was the initial device itself offline?
    if (offlineDevices.some(d => d.deviceId === initialDevice._id.toString())) {
        return `**Root Cause:** The primary device ${initialDevice.deviceName} is offline. This is the source of the outage for all connected users. 
                **Recommendation:** Check the power and physical connections for ${initialDevice.deviceName}.`;
    }

    // Priority 2: If a user was the target, what is their specific status?
    if (targetUser) {
        const targetUserCheck = userChecks.find(u => u.userId === targetUser._id.toString());
        if (targetUserCheck) {
            if (targetUserCheck.isOnline) {
                const otherOfflineUsers = offlineUsers.filter(u => u.userId !== targetUser._id.toString());
                if (otherOfflineUsers.length > 0) {
                    return `**All Clear (with observations):** The user ${targetUser.officialName} is online and their connection appears healthy. However, we detected that **${otherOfflineUsers.length} other users** on the same station are currently offline.
                            **Recommendation:** While the target user's connection is stable, the offline neighbors could indicate a potential issue with the station or upstream network. Monitor the situation.`;
                }
                return `**All Clear:** The user ${targetUser.officialName} is online and their connection appears healthy. 
                        **Recommendation:** If the user is still reporting issues, the problem may be with their local device (e.g., router, computer).`;
            } else {
                 const otherOnlineUsers = onlineUsers.filter(u => u.userId !== targetUser._id.toString());
                 if (otherOnlineUsers.length > 0) {
                     return `**Root Cause:** The user ${targetUser.officialName} is offline. However, all network hardware is responding and **${otherOnlineUsers.length} other users** on the same station are online.
                             **Recommendation:** This indicates an issue isolated to ${targetUser.officialName}. Verify their PPPoE credentials, account expiry, and advise them to check their router.`;
                 } else {
                     return `**Root Cause:** The user ${targetUser.officialName} is offline, and **all other ${offlineUsers.length > 0 ? offlineUsers.length - 1 : 0} users** on the same station are also offline.
                             **Recommendation:** This suggests a wider issue affecting multiple users. Investigate the health of the station ${initialDevice.deviceName} and the upstream network infrastructure.`;
                 }
            }
        }
    }

    // Priority 3: If an Access Point was the target, what is the status of its stations?
    if (initialDevice.deviceType === 'Access') {
        const totalStations = deviceChecks.length - 1;
        if (offlineDevices.length > 0) {
            const offlineStationNames = offlineDevices.map(d => d.deviceName).join(', ');
            return `**Root Cause:** The access point ${initialDevice.deviceName} is online, but **${offlineDevices.length} of its ${totalStations} stations** are currently offline. This is impacting all users connected to those offline stations.
                    **Recommendation:** This suggests power or alignment issues. Investigate the stations listed as 'DOWN' in the 'Device Checks' section: ${offlineStationNames}.`;
        }
        if (offlineUsers.length > 0) {
            return `**All Clear (with observations):** The access point ${initialDevice.deviceName} and all its connected stations are online. However, we detected that **${offlineUsers.length} of ${userChecks.length} total users** are currently offline.
                    **Recommendation:** This could indicate account issues. Verify the PPPoE credentials and account expiry dates for the offline users listed in the 'User Status Checks' section.`;
        }
        return `**All Clear:** No issues detected. The access point ${initialDevice.deviceName}, all **${totalStations} of its connected stations**, and all **${userChecks.length} associated users** are online and responsive.`;
    }
  
    // Priority 4: If a Station was the target, what is the status of its users?
    if (initialDevice.deviceType === 'Station' && offlineUsers.length > 0) {
        return `**All Clear (with observations):** The station ${initialDevice.deviceName} is online and responsive. However, we detected that **${offlineUsers.length} of its ${userChecks.length} users** are currently offline.
                **Recommendation:** This could indicate account issues. Verify the PPPoE credentials and account expiry dates for the offline users listed in the 'User Status Checks' section.`;
    }

    return `**All Clear:** No issues detected. All network devices and associated users are online and responsive. The connection appears healthy.`;
};

module.exports = {
  runBulkDiagnostic,
};
