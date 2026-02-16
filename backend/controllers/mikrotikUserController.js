const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');
const MikrotikRouter = require('../models/MikrotikRouter');
const UserService = require('../services/userService');
const MikrotikHardwareService = require('../services/MikrotikHardwareService');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const Transaction = require('../models/Transaction');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils');

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
  const query = { tenant: req.user.tenant };

  const users = await MikrotikUser.find(query)
    .populate('mikrotikRouter')
    .populate('package')
    .populate('station');
  res.status(200).json(users);
});

// @desc    Get single Mikrotik User by ID
// @route   GET /api/mikrotik/users/:id
// @access  Private
const getMikrotikUserById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const user = await MikrotikUser.findOne(query)
    .populate('mikrotikRouter')
    .populate('package')
    .populate('station');

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
  const query = { tenant: req.user.tenant };

  const clients = await MikrotikUser.find(query).select('_id officialName mobileNumber expiryDate');
  res.status(200).json(clients);
});

// @desc    Get count of new subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-new-subscribers
// @access  Private/Admin
const getMonthlyNewSubscribers = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

  const count = await MikrotikUser.countDocuments(query);

  res.status(200).json({ count });
});

// @desc    Get count of paid subscribers for the current month
// @route   GET /api/mikrotik/users/stats/monthly-paid-subscribers
// @access  Private/Admin
const getMonthlyPaidSubscribers = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  query.expiryDate = { $gte: new Date() };
  query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

  const count = await MikrotikUser.countDocuments(query);

  res.status(200).json({ count });
});

// @desc    Get monthly total subscribers for a given year
// @route   GET /api/mikrotik/users/stats/monthly-total-subscribers/:year
// @access  Private/Admin
const getMonthlyTotalSubscribers = asyncHandler(async (req, res) => {
  const { year } = req.params;

  const query = { tenant: req.user.tenant };

  const monthlyTotals = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = new Date(year, i, 1);
    const endOfMonth = new Date(year, i + 1, 0); // Last day of the month

    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

    const count = await MikrotikUser.countDocuments(query);

    monthlyTotals.push({
      month: i + 1, // Month number (1-12)
      total: count,
    });
  }

  res.status(200).json(monthlyTotals);
});

// @desc    Get Mikrotik User Traffic Statistics
// @route   GET /api/mikrotik/users/:id/traffic
// @access  Private
const getMikrotikUserTraffic = asyncHandler(async (req, res) => {
  const trafficData = await MikrotikHardwareService.getUserTraffic(req.params.id);
  res.status(200).json(trafficData);
});

// @desc    Get all Mikrotik Users for a specific station
// @route   GET /api/devices/:stationId/users
// @access  Private
const getMikrotikUsersByStation = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  const query = { station: stationId, tenant: req.user.tenant };

  const users = await MikrotikUser.find(query)
    .populate('package')
    .populate('mikrotikRouter', 'name');
  res.status(200).json(users);
});

// @desc    Get Downtime Logs for a Mikrotik User
// @route   GET /api/mikrotik/users/:userId/downtime-logs
// @access  Private/Admin
const getDowntimeLogs = asyncHandler(async (req, res) => {
  const query = { _id: req.params.userId, tenant: req.user.tenant };

  const mikrotikUser = await MikrotikUser.findOne(query);
  if (!mikrotikUser) {
    res.status(404);
    throw new Error('Mikrotik user not found or not authorized');
  }

  const logs = await UserDowntimeLog.find({ mikrotikUser: req.params.userId }).sort({ downStartTime: -1 });
  res.status(200).json(logs);
});

// @desc    Get users with delayed payments
// @route   GET /api/mikrotik/users/delayed-payments
// @access  Private/Admin
const getDelayedPayments = asyncHandler(async (req, res) => {
  const { days_overdue, name_search } = req.query;

  if (!days_overdue) {
    res.status(400);
    throw new Error('days_overdue query parameter is required');
  }

  const days = parseInt(days_overdue, 10);
  if (isNaN(days)) {
    res.status(400);
    throw new Error('days_overdue must be a number');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filter = { tenant: req.user.tenant };

  filter.expiryDate = { $lt: today };

  if (name_search) {
    filter.$or = [
      { officialName: { $regex: name_search, $options: 'i' } },
      { username: { $regex: name_search, $options: 'i' } },
    ];
  }

  const users = await MikrotikUser.find(filter).populate('package');

  const usersWithDaysOverdue = users
    .map(user => {
      const expiryDate = new Date(user.expiryDate);
      const diffTime = today.getTime() - expiryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...user.toObject(),
        daysOverdue: diffDays,
      };
    })
    .filter(user => user.daysOverdue >= days);

  res.status(200).json(usersWithDaysOverdue);
});


// @desc    Get payment statistics for a single Mikrotik User
// @route   GET /api/mikrotik/users/:id/payment-stats
// @access  Private/Admin
const getUserPaymentStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.params.id;
        const userQuery = { _id: userId, tenant: req.user.tenant };

        const user = await MikrotikUser.findOne(userQuery);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Query for M-Pesa transactions linked to this Mikrotik user
        const mpesaTransactions = await Transaction.find({
            mikrotikUser: userId,
            tenant: req.user.tenant,
            paymentMethod: { $regex: /M-Pesa/i } // Find all M-Pesa related payments
        }).sort({ transactionDate: -1 });

        // Calculate statistics
        const totalSpentMpesa = mpesaTransactions.reduce((acc, curr) => acc + curr.amount, 0);
        const totalMpesaTransactions = mpesaTransactions.length;
        const lastMpesaPayment = totalMpesaTransactions > 0 ? mpesaTransactions[0] : null;
        const averageMpesaTransaction = totalMpesaTransactions > 0 ? totalSpentMpesa / totalMpesaTransactions : 0;

        res.status(200).json({
            totalSpentMpesa,
            lastMpesaPaymentDate: lastMpesaPayment ? lastMpesaPayment.transactionDate : null,
            lastMpesaPaymentAmount: lastMpesaPayment ? lastMpesaPayment.amount : null,
            totalMpesaTransactions,
            averageMpesaTransaction,
            mpesaTransactionHistory: mpesaTransactions, // Send the full history
        });
    } catch (error) {
        console.error(`Error fetching M-Pesa payment stats for user ${req.params.id}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
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
  getMikrotikUserTraffic,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
  getMikrotikUsersByStation,
  manualDisconnectUser,
  manualConnectUser,
};