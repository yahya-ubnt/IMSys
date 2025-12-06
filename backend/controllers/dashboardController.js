const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');

// @desc    Get collections summary (Today, Weekly, Monthly, Yearly)
// @route   GET /api/dashboard/collections/summary
// @access  Private
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
    const matchQuery = { tenant: req.user.tenant };

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

  const matchQuery = { tenant: req.user.tenant };

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
// @access  Private
const getMonthlyExpenseSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const matchQuery = { tenant: req.user.tenant };

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
// @access  Private
const getNewSubscriptionsCount = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const query = { tenant: req.user.tenant };

  query.createdAt = {
    $gte: startOfMonth,
    $lte: today,
  };

  const count = await MikrotikUser.countDocuments(query);

  res.json({ newSubscriptions: count });
});

// @desc    Get total count of all users
// @route   GET /api/dashboard/users/total
// @access  Private
const getTotalUsersCount = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const count = await MikrotikUser.countDocuments(query);
  res.json({ totalUsers: count });
});

// @desc    Get count of active users
// @route   GET /api/dashboard/users/active
// @access  Private
const getActiveUsersCount = asyncHandler(async (req, res) => {
  const today = new Date();
  const query = { tenant: req.user.tenant };

  query.expiryDate = { $gte: today };
  query.isSuspended = false;

  const count = await MikrotikUser.countDocuments(query);
  res.json({ activeUsers: count });
});

// @desc    Get count of expired users
// @route   GET /api/dashboard/users/expired
// @access  Private
const getExpiredUsersCount = asyncHandler(async (req, res) => {
  const today = new Date();
  const query = { tenant: req.user.tenant };

  query.$or = [
    { expiryDate: { $lt: today } },
    { isSuspended: true },
  ];

  const count = await MikrotikUser.countDocuments(query);
  res.json({ expiredUsers: count });
});

const getExpensesSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
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

  const getExpenseAmount = async (startDate, endDate) => {
    const matchQuery = { tenant: req.user.tenant };

    matchQuery.expenseDate = {
      $gte: startDate,
      $lte: endDate,
    };

    const result = await Expense.aggregate([
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

  const todayExpense = await getExpenseAmount(today, endOfToday);
  const weeklyExpense = await getExpenseAmount(startOfWeek, endOfWeek);
  const monthlyExpense = await getExpenseAmount(startOfMonth, endOfMonth);
  const yearlyExpense = await getExpenseAmount(startOfYear, endOfYear);

  res.json({
    today: todayExpense,
    weekly: weeklyExpense,
    monthly: monthlyExpense,
    yearly: yearlyExpense,
  });
});

module.exports = {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
  getExpensesSummary,
};