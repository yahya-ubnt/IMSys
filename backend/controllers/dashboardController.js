const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');

// @desc    Get collections summary (Today, Weekly, Monthly, Yearly)
// @route   GET /api/dashboard/collections/summary
// @access  Public
const getCollectionsSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Assuming Sunday is the first day of the week (0)
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const endOfYear = new Date(today.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  const getCollectionAmount = async (startDate, endDate) => {
    let matchQuery = {};
    if (!req.user.roles.includes('SUPER_ADMIN')) {
      matchQuery.tenantOwner = req.user.tenantOwner;
    }

    matchQuery.transactionDate = {
      $gte: startDate,
      $lte: endDate,
    };

    const result = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalAmount : 0;
  };

  const todayCollection = await getCollectionAmount(today, endOfToday);
  const weeklyCollection = await getCollectionAmount(startOfWeek, endOfWeek);
  const monthlyCollection = await getCollectionAmount(startOfMonth, endOfMonth);
  const yearlyCollection = await getCollectionAmount(startOfYear, endOfYear);

  res.json({
    today: todayCollection,
    weekly: weeklyCollection,
    monthly: monthlyCollection,
    yearly: yearlyCollection,
  });
});

const getMonthlyCollectionsAndExpenses = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { year } = req.query;

  const parsedYear = parseInt(year);

  let matchQuery = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    matchQuery.tenantOwner = req.user.tenantOwner;
  }

  // Fetch monthly collections
  const monthlyCollections = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $match: {
        $expr: { $eq: [{ $year: '$transactionDate' }, parsedYear] }
      },
    },
    {
      $group: {
        _id: { $month: '$transactionDate' },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        amount: '$totalAmount',
      },
    },
  ]);

  // Fetch monthly expenses
  const monthlyExpenses = await Expense.aggregate([
    { $match: matchQuery },
    {
      $match: {
        $expr: { $eq: [{ $year: '$expenseDate' }, parsedYear] } // Assuming 'expenseDate' field for expenses
      },
    },
    {
      $group: {
        _id: { $month: '$expenseDate' },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        amount: '$totalAmount',
      },
    },
  ]);

  // Map month numbers to names and ensure all 12 months are present
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formattedMonthlyData = monthNames.map((name, index) => {
    const monthNumber = index + 1;
    const collectionData = monthlyCollections.find(item => item.month === monthNumber);
    const expenseData = monthlyExpenses.find(item => item.month === monthNumber);
    return {
      month: name,
      collections: collectionData ? collectionData.amount : 0,
      expenses: expenseData ? expenseData.amount : 0,
    };
  });

  res.json(formattedMonthlyData);
});

// @desc    Get total expenses for the current month
// @route   GET /api/dashboard/expenses/monthly-summary
// @access  Public
const getMonthlyExpenseSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  let matchQuery = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    matchQuery.tenantOwner = req.user.tenantOwner;
  }

  matchQuery.expenseDate = {
    $gte: startOfMonth,
    $lte: endOfMonth,
  };

  const result = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalMonthlyExpense: { $sum: '$amount' },
      },
    },
  ]);

  const monthlyExpense = result.length > 0 ? result[0].totalMonthlyExpense : 0;

  res.json({ monthlyExpense });
});

// @desc    Get count of new subscriptions for the current month
// @route   GET /api/dashboard/subscriptions/new
// @access  Public
const getNewSubscriptionsCount = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  query.createdAt = {
    $gte: startOfMonth,
    $lte: today,
  };

  const count = await MikrotikUser.countDocuments(query);

  res.json({ newSubscriptions: count });
});

// @desc    Get total count of all users
// @route   GET /api/dashboard/users/total
// @access  Public
const getTotalUsersCount = asyncHandler(async (req, res) => {
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const count = await MikrotikUser.countDocuments(query);
  res.json({ totalUsers: count });
});

// @desc    Get count of active users
// @route   GET /api/dashboard/users/active
// @access  Public
const getActiveUsersCount = asyncHandler(async (req, res) => {
  const today = new Date();
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  query.expiryDate = { $gte: today };
  query.isSuspended = false;

  const count = await MikrotikUser.countDocuments(query);
  res.json({ activeUsers: count });
});

// @desc    Get count of expired users
// @route   GET /api/dashboard/users/expired
// @access  Public
const getExpiredUsersCount = asyncHandler(async (req, res) => {
  const today = new Date();
  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  query.$or = [
    { expiryDate: { $lt: today } },
    { isSuspended: true },
  ];

  const count = await MikrotikUser.countDocuments(query);
  res.json({ expiredUsers: count });
});

module.exports = {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
};