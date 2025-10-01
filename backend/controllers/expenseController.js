const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const moment = require('moment-timezone');
moment.tz.setDefault('Africa/Nairobi');
const mongoose = require('mongoose');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, expenseType, description, expenseDate, status } = req.body;

  if (!title || !amount || !expenseType || !expenseDate) {
    res.status(400);
    throw new Error('Please add all required fields: title, amount, expenseType, expenseDate');
  }

  const expense = await Expense.create({
    title,
    amount,
    expenseType,
    description,
    expenseDate,
    status,
    expenseBy: req.user._id,
  });

  res.status(201).json(expense);
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ expenseBy: req.user._id })
    .populate('expenseType', 'name')
    .populate('expenseBy', 'name email');
  res.status(200).json(expenses);
});

// @desc    Get a single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('expenseType', 'name')
    .populate('expenseBy', 'name email');

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
  const { title, amount, expenseType, description, expenseDate, status } = req.body;

  let expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  // Add authorization check if needed

  expense.title = title || expense.title;
  expense.amount = amount || expense.amount;
  expense.expenseType = expenseType || expense.expenseType;
  expense.description = description || expense.description;
  expense.expenseDate = expenseDate || expense.expenseDate;
  expense.status = status || expense.status;

  const updatedExpense = await expense.save();

  res.status(200).json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  // Add authorization check if needed

  await expense.deleteOne();

  res.status(200).json({ message: 'Expense removed' });
});

// @desc    Get monthly expense total
// @route   GET /api/expenses/monthly-total
// @access  Private
const getMonthlyExpenseTotal = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user ID not found');
  }

  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');

  console.log('Fetching monthly expenses for user:', req.user._id);
  console.log('Date range:', startOfMonth.toDate(), 'to', endOfMonth.toDate());

  const totalExpenses = await Expense.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: startOfMonth.toDate(),
          $lte: endOfMonth.toDate(),
        },
        expenseBy: new mongoose.Types.ObjectId(req.user._id), // Convert to ObjectId
      },
    },
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
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user ID not found');
  }

  const { year } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Please provide a year.');
  }

  const startOfYear = moment().year(parseInt(year)).startOf('year');
  const endOfYear = moment().year(parseInt(year)).endOf('year');

  const monthlyTotals = await Expense.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: startOfYear.toDate(),
          $lte: endOfYear.toDate(),
        },
        expenseBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
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
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user ID not found');
  }

  const { year, month } = req.query;

  if (!year || !month) {
    res.status(400);
    throw new Error('Please provide a year and month.');
  }

  const startDate = moment(`${year}-${month}-01`).startOf('month');
  const endDate = moment(startDate).endOf('month');
  const daysInMonth = endDate.date();

  const dailyTotals = await Expense.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
        expenseBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
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

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseTotal,
  getYearlyMonthlyExpenseTotals,
  getDailyExpenseTotals,
};
