const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const DeviceService = require('../services/DeviceService');

// @desc    Create a new device
// @route   POST /api/devices
// @access  Admin
const createDevice = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const createdDevice = await DeviceService.createDevice(req.body, req.user.tenant);
  res.status(201).json(createdDevice);
});

// @desc    Get all devices
// @route   GET /api/devices
// @access  Admin
const getDevices = asyncHandler(async (req, res) => {
  const devices = await DeviceService.getDevices(req.user.tenant, req.query);
  res.json(devices);
});

// @desc    Get a single device by ID
// @route   GET /api/devices/:id
// @access  Admin
const getDeviceById = asyncHandler(async (req, res) => {
  const device = await DeviceService.getDeviceById(req.params.id, req.user.tenant);
  res.json(device);
});

// @desc    Update a device
// @route   PUT /api/devices/:id
// @access  Admin
const updateDevice = asyncHandler(async (req, res) => {
  const updatedDevice = await DeviceService.updateDevice(req.params.id, req.body, req.user.tenant);
  res.json(updatedDevice);
});

// @desc    Delete a device
// @route   DELETE /api/devices/:id
// @access  Admin
const deleteDevice = asyncHandler(async (req, res) => {
  const message = await DeviceService.deleteDevice(req.params.id, req.user.tenant);
  res.json(message);
});

// @desc    Get downtime logs for a device
// @route   GET /api/devices/:id/downtime
// @access  Admin
const getDeviceDowntimeLogs = asyncHandler(async (req, res) => {
  const logs = await DeviceService.getDeviceDowntimeLogs(req.params.id, req.user.tenant);
  res.json(logs);
});

// @desc    Perform a live ping check on a device
// @route   POST /api/devices/:id/ping
// @access  Admin
const pingDevice = asyncHandler(async (req, res) => {
  const result = await DeviceService.pingDevice(req.params.id, req.user.tenant);
  res.status(200).json(result);
});

// @desc    Enable Netwatch monitoring for a device
// @route   POST /api/devices/:id/enable-monitoring
// @access  Admin
const enableMonitoring = asyncHandler(async (req, res) => {
  const result = await DeviceService.enableMonitoring(req.params.id, req.user.tenant);
  res.status(200).json(result);
});

module.exports = {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getDeviceDowntimeLogs,
  pingDevice,
  enableMonitoring,
};
