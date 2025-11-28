const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const moment = require('moment-timezone');
moment.tz.setDefault('Africa/Nairobi');
const mongoose = require('mongoose');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, amount, expenseType, description, expenseDate } = req.body;

  const expense = await Expense.create({
    title,
    amount,
    expenseType,
    description: sanitizeString(description), // Sanitize description
    expenseDate,
    expenseBy: req.user._id,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });

  res.status(201).json(expense);
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const expenses = await Expense.find(query)
    .populate('expenseType', 'name')
    .populate('expenseBy', 'fullName email'); // Keep expenseBy for auditing
  res.status(200).json(expenses);
});

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const expense = await Expense.findOne(query)
    .populate('expenseType', 'name')
    .populate('expenseBy', 'fullName email');

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  res.status(200).json(expense);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const { title, amount, expenseType, description, expenseDate } = req.body;

  let expense = await Expense.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  expense.title = title || expense.title;
  expense.amount = amount || expense.amount;
  expense.expenseType = expenseType || expense.expenseType;
  expense.description = description ? sanitizeString(description) : expense.description;
  expense.expenseDate = expenseDate || expense.expenseDate;

  const updatedExpense = await expense.save();

  res.status(200).json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  await expense.deleteOne();

  res.status(200).json({ message: 'Expense removed' });
});

// @desc    Get monthly expense total
// @route   GET /api/expenses/monthly-total
// @access  Private
const getMonthlyExpenseTotal = asyncHandler(async (req, res) => {
  const matchQuery = { tenant: req.user.tenant };

  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');

  matchQuery.expenseDate = {
    $gte: startOfMonth.toDate(),
    $lte: endOfMonth.toDate(),
  };

  const totalExpenses = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  res.json({
    total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
  });
});

// @desc    Get yearly monthly expense totals
// @route   GET /api/expenses/yearly-monthly-totals
// @access  Private
const getYearlyMonthlyExpenseTotals = asyncHandler(async (req, res) => {
  const { year } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Please provide a year.');
  }

  const matchQuery = { tenant: req.user.tenant };

  const startOfYear = moment().year(parseInt(year)).startOf('year');
  const endOfYear = moment().year(parseInt(year)).endOf('year');

  matchQuery.expenseDate = {
    $gte: startOfYear.toDate(),
    $lte: endOfYear.toDate(),
  };

  const monthlyTotals = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { month: { $month: "$expenseDate" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // Initialize all months with 0
  const fullYearTotals = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
  }));

  // Merge fetched totals with full year totals
  monthlyTotals.forEach((item) => {
    const index = item._id.month - 1;
    if (fullYearTotals[index]) {
      fullYearTotals[index].total = item.total;
    }
  });

  res.json(fullYearTotals);
});


// @desc    Get daily expense totals for a given month and year
// @route   GET /api/expenses/daily-expense-totals
// @access  Private
const getDailyExpenseTotals = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    res.status(400);
    throw new Error('Please provide a year and month.');
  }

  const matchQuery = { tenant: req.user.tenant };

  const startDate = moment(`${year}-${month}-01`).startOf('month');
  const endDate = moment(startDate).endOf('month');
  const daysInMonth = endDate.date();

  matchQuery.expenseDate = {
    $gte: startDate.toDate(),
    $lte: endDate.toDate(),
  };

  const dailyTotals = await Expense.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { day: { $dayOfMonth: '$expenseDate' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);

  const fullMonthTotals = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    total: 0,
  }));

  dailyTotals.forEach((item) => {
    const index = item._id.day - 1;
    if (fullMonthTotals[index]) {
      fullMonthTotals[index].total = item.total;
    }
  });

  res.json(fullMonthTotals);
});

const getExpenseStats = asyncHandler(async (req, res) => {
  const matchQuery = { tenant: req.user.tenant };

  const today = moment();
  const startOfToday = today.clone().startOf('day');
  const endOfToday = today.clone().endOf('day');

  const startOfWeek = today.clone().startOf('week');
  const endOfWeek = today.clone().endOf('week');

  const startOfMonth = today.clone().startOf('month');
  const endOfMonth = today.clone().endOf('month');

  const startOfYear = today.clone().startOf('year');
  const endOfYear = today.clone().endOf('year');

  const todayQuery = { ...matchQuery, expenseDate: { $gte: startOfToday.toDate(), $lte: endOfToday.toDate() } };
  const weekQuery = { ...matchQuery, expenseDate: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() } };
  const monthQuery = { ...matchQuery, expenseDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() } };
  const yearQuery = { ...matchQuery, expenseDate: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() } };

  const todayTotal = await Expense.aggregate([{ $match: todayQuery }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const weekTotal = await Expense.aggregate([{ $match: weekQuery }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const monthTotal = await Expense.aggregate([{ $match: monthQuery }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const yearTotal = await Expense.aggregate([{ $match: yearQuery }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

  res.json({
    today: todayTotal.length > 0 ? todayTotal[0].total : 0,
    week: weekTotal.length > 0 ? weekTotal[0].total : 0,
    month: monthTotal.length > 0 ? monthTotal[0].total : 0,
    year: yearTotal.length > 0 ? yearTotal[0].total : 0,
  });
});

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseTotal,
  getYearlyMonthlyExpenseTotals,
  getDailyExpenseTotals,
  getExpenseStats,
};
