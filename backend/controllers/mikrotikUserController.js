const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');
const MikrotikRouter = require('../models/MikrotikRouter');
const UserService = require('../services/userService');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const Transaction = require('../models/Transaction');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils');
const { decrypt } = require('../utils/crypto');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

// @desc    Create a new Mikrotik User
// @route   POST /api/mikrotik/users
// @access  Private
const createMikrotikUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const mikrotikUser = await UserService.createMikrotikUser(req.body, req.user.tenant);
  res.status(201).json(mikrotikUser);
});

// @desc    Get all Mikrotik Users
// @route   GET /api/mikrotik/users
// @access  Private
const getMikrotikUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getPopulatedMikrotikUsers(req.user.tenant);
  res.status(200).json(users);
});

// @desc    Get single Mikrotik User by ID
// @route   GET /api/mikrotik/users/:id
// @access  Private
const getMikrotikUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getPopulatedMikrotikUserById(req.params.id, req.user.tenant);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('Mikrotik User not found');
  }
});

// @desc    Update a Mikrotik User
// @route   PUT /api/mikrotik/users/:id
// @access  Private
const updateMikrotikUser = asyncHandler(async (req, res) => {
  const updatedUser = await UserService.updateUser(req.params.id, req.body, req.user.tenant);
  res.status(200).json(updatedUser);
});

// @desc    Delete a Mikrotik User
// @route   DELETE /api/mikrotik/users/:id
// @access  Private
const deleteMikrotikUser = asyncHandler(async (req, res) => {
  await UserService.deleteUser(req.params.id, req.user.tenant);
  res.status(200).json({ message: 'Mikrotik User removal initiated' });
});

// ... (manualDisconnectUser, manualConnectUser logic updated to use generic sync)

const manualDisconnectUser = asyncHandler(async (req, res) => {
  const updatedUser = await UserService.updateUser(req.params.id, {
    isSuspended: true,
    isManuallyDisconnected: true,
  }, req.user.tenant);

  res.status(200).json({ message: 'User disconnection initiated successfully', user: updatedUser });
});

const manualConnectUser = asyncHandler(async (req, res) => {
  const updatedUser = await UserService.updateUser(req.params.id, {
    isSuspended: false,
    isManuallyDisconnected: false,
  }, req.user.tenant);

  res.status(200).json({ message: 'User connection initiated successfully', user: updatedUser });
});


// @desc    Get Mikrotik Clients (for SMS dropdowns)
// @route   GET /api/mikrotik/users/clients-for-sms
// @access  Private
const getMikrotikClientsForSms = asyncHandler(async (req, res) => {
  const clients = await UserService.getMikrotikClientsForSms(req.user.tenant);
  res.status(200).json(clients);
});

// @desc    Get count of new subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-new-subscribers
// @access  Private/Admin
const getMonthlyNewSubscribers = asyncHandler(async (req, res) => {
  const { count } = await UserService.getMonthlyNewSubscribers(req.user.tenant);
  res.status(200).json({ count });
});

// @desc    Get count of paid subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-paid-subscribers
// @access  Private/Admin
const getMonthlyPaidSubscribers = asyncHandler(async (req, res) => {
  const { count } = await UserService.getMonthlyPaidSubscribers(req.user.tenant);
  res.status(200).json({ count });
});

// @desc    Get monthly total subscribers for a given year
// @route   GET /api/mikrotik/users/stats/monthly-total-subscribers/:year
// @access  Private/Admin
const getMonthlyTotalSubscribers = asyncHandler(async (req, res) => {
  const { year } = req.params;
  const monthlyTotals = await UserService.getMonthlyTotalSubscribers(year, req.user.tenant);
  res.status(200).json(monthlyTotals);
});

// @desc    Get Mikrotik User Status
// @route   GET /api/mikrotik/users/:id/status
// @access  Private
const getMikrotikUserStatus = asyncHandler(async (req, res) => {
  const { status } = await UserService.getMikrotikUserStatus(req.params.id, req.user.tenant);
  res.status(200).json({ status });
});

// @desc    Get Mikrotik User Traffic Statistics
// @route   GET /api/mikrotik/users/:id/traffic
// @access  Private
const getMikrotikUserTraffic = asyncHandler(async (req, res) => {
  const trafficData = await UserService.getMikrotikUserTraffic(req.params.id, req.user.tenant);
  res.status(200).json(trafficData);
});

// @desc    Get all Mikrotik Users for a specific station
// @route   GET /api/devices/:stationId/users
// @access  Private
const getMikrotikUsersByStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const users = await UserService.getMikrotikUsersByStation(stationId, req.user.tenant);
  res.status(200).json(users);
});

// @desc    Get Downtime Logs for a Mikrotik User
// @route   GET /api/mikrotik/users/:userId/downtime-logs
// @access  Private/Admin
const getDowntimeLogs = asyncHandler(async (req, res) => {
  const logs = await UserService.getDowntimeLogs(req.params.userId, req.user.tenant);
  res.status(200).json(logs);
});

// @desc    Get users with delayed payments
// @route   GET /api/mikrotik/users/delayed-payments
// @access  Private/Admin
const getDelayedPayments = asyncHandler(async (req, res) => {
  const { days_overdue, name_search } = req.query;
  const usersWithDaysOverdue = await UserService.getDelayedPayments(days_overdue, name_search, req.user.tenant);
  res.status(200).json(usersWithDaysOverdue);
});


// @desc    Get payment statistics for a single Mikrotik User
// @route   GET /api/mikrotik/users/:id/payment-stats
// @access  Private/Admin
const getUserPaymentStats = asyncHandler(async (req, res) => {
    const stats = await UserService.getUserPaymentStats(req.params.id, req.user.tenant);
    res.status(200).json(stats);
});

module.exports = {
  createMikrotikUser,
  getMikrotikUsers,
  getMikrotikUserById,
  updateMikrotikUser,
  deleteMikrotikUser,
  getMikrotikClientsForSms,
  getMonthlyNewSubscribers,
  getMonthlyPaidSubscribers,
  getMonthlyTotalSubscribers,
  getMikrotikUserStatus,
  getMikrotikUserTraffic,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
  getMikrotikUsersByStation,
  manualDisconnectUser,
  manualConnectUser,
};