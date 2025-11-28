const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Device = require('../models/Device');
const DowntimeLog = require('../models/DowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter'); // Import MikrotikRouter
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Create a new device
// @route   POST /api/devices
// @access  Admin
const createDevice = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    router,
    ipAddress,
    macAddress,
    deviceType,
    location,
    deviceName,
    deviceModel,
    loginUsername,
    loginPassword,
    ssid,
    wirelessPassword,
  } = req.body;

  // Verify ownership of the router
  const parentRouter = await MikrotikRouter.findOne({ _id: router, tenant: req.user.tenant });
  if (!parentRouter) {
    res.status(404);
    throw new Error('Router not found');
  }

  const deviceExists = await Device.findOne({ macAddress, tenant: req.user.tenant });

  if (deviceExists) {
    res.status(400);
    throw new Error('Device with this MAC address already exists');
  }

  const device = new Device({
    router,
    ipAddress,
    macAddress,
    deviceType,
    location: sanitizeString(location),
    deviceName: sanitizeString(deviceName),
    deviceModel: sanitizeString(deviceModel),
    loginUsername: sanitizeString(loginUsername),
    loginPassword, // Will be encrypted by pre-save hook
    ssid: sanitizeString(ssid),
    wirelessPassword, // Will be encrypted by pre-save hook
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });

  const createdDevice = await device.save();
  res.status(201).json(createdDevice);
});

// @desc    Get all devices
// @route   GET /api/devices
// @access  Admin
const getDevices = asyncHandler(async (req, res) => {
  const { deviceType } = req.query;
  const query = { tenant: req.user.tenant };

  if (deviceType) {
    query.deviceType = deviceType;
  }

  const devices = await Device.find(query)
    .populate('router', 'name ipAddress')
    .sort({ deviceType: 1 }); // Sort by deviceType, 'Access' then 'Station'
  res.json(devices);
});

// @desc    Get a single device by ID
// @route   GET /api/devices/:id
// @access  Admin
const getDeviceById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const device = await Device.findOne(query).populate('router', 'name ipAddress');

  if (device) {
    let responseDevice = device.toObject(); // Convert to plain object to add properties

    if (responseDevice.deviceType === 'Access' && responseDevice.ssid) {
      const connectedStations = await Device.find({ deviceType: 'Station', ssid: responseDevice.ssid, tenant: device.tenant });
      responseDevice.connectedStations = connectedStations;
    } else if (responseDevice.deviceType === 'Station' && responseDevice.ssid) {
      const connectedAccessPoint = await Device.findOne({ deviceType: 'Access', ssid: responseDevice.ssid, tenant: device.tenant });
      responseDevice.connectedAccessPoint = connectedAccessPoint;
    }

    res.json(responseDevice);
  } else {
    res.status(404);
    throw new Error('Device not found');
  }
});

// @desc    Update a device
// @route   PUT /api/devices/:id
// @access  Admin
const updateDevice = asyncHandler(async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!device) {
    res.status(404);
    throw new Error('Device not found');
  }

  // Update fields
  device.router = req.body.router || device.router;
  device.ipAddress = req.body.ipAddress || device.ipAddress;
  device.macAddress = req.body.macAddress || device.macAddress;
  device.deviceType = req.body.deviceType || device.deviceType;
  device.location = req.body.location ? sanitizeString(req.body.location) : device.location;
  device.deviceName = req.body.deviceName ? sanitizeString(req.body.deviceName) : device.deviceName;
  device.deviceModel = req.body.deviceModel ? sanitizeString(req.body.deviceModel) : device.deviceModel;
  device.loginUsername = req.body.loginUsername ? sanitizeString(req.body.loginUsername) : device.loginUsername;
  device.ssid = req.body.ssid ? sanitizeString(req.body.ssid) : device.ssid;

  // Handle password updates
  if (req.body.loginPassword) {
    device.loginPassword = req.body.loginPassword; // Encryption handled by pre-save hook
  }
  if (req.body.wirelessPassword) {
    device.wirelessPassword = req.body.wirelessPassword; // Encryption handled by pre-save hook
  }

  const updatedDevice = await device.save();
  res.json(updatedDevice);
});

// @desc    Delete a device
// @route   DELETE /api/devices/:id
// @access  Admin
const deleteDevice = asyncHandler(async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (device) {
    // First, delete all associated downtime logs
    await DowntimeLog.deleteMany({ device: device._id });
    // Then, remove the device itself
    await device.deleteOne();
    res.json({ message: 'Device and associated downtime logs removed' });
  } else {
    res.status(404);
    throw new Error('Device not found');
  }
});

// @desc    Get downtime logs for a device
// @route   GET /api/devices/:id/downtime
// @access  Admin
const getDeviceDowntimeLogs = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const device = await Device.findOne(query);

  if (!device) {
    res.status(404);
    throw new Error('Device not found');
  }

  const logs = await DowntimeLog.find({ device: device._id }).sort({ downStartTime: -1 });
  res.json(logs);
});

module.exports = {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getDeviceDowntimeLogs,
};
