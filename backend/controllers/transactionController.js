const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

// @desc    Create new daily transaction
// @route   POST /api/daily-transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, amount, method, transactionMessage, description, label, transactionId, transactionDate, transactionTime, receiverEntity, phoneNumber, newBalance, transactionCost } = req.body;

  const dailyTransaction = new Transaction({
    date,
    amount,
    method,
    transactionMessage,
    description,
    label,
    transactionId,
    transactionDate,
    transactionTime,
    receiverEntity,
    phoneNumber,
    newBalance,
    transactionCost,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });

  const createdTransaction = await dailyTransaction.save();
  res.status(201).json(createdTransaction);
});

// @desc    Get all daily transactions
// @route   GET /api/daily-transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, method, label, search } = req.query;

  const query = { tenant: req.user.tenant };

  if (startDate) {
    query.date = { ...query.date, $gte: new Date(startDate) };
  }
  if (endDate) {
    query.date = { ...query.date, $lte: new Date(endDate) };
  }
  if (method) {
    query.method = method;
  }
  if (label) {
    query.label = label;
  }
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { transactionMessage: { $regex: search, $options: 'i' } },
      { method: { $regex: search, $options: 'i' } },
      { label: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
      { transactionTime: { $regex: search, $options: 'i' } },
      { receiverEntity: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { newBalance: { $regex: search, $options: 'i' } },
    ];
  }

  const dailyTransactions = await Transaction.find(query).sort({ date: -1 });
  res.json(dailyTransactions);
});

// @desc    Get single daily transaction by ID
// @route   GET /api/daily-transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const dailyTransaction = await Transaction.findOne(query);

  if (dailyTransaction) {
    res.json(dailyTransaction);
  } else {
    res.status(404);
    throw new Error('Daily transaction not found');
  }
});

// @desc    Update daily transaction
// @route   PUT /api/daily-transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const { date, amount, method, transactionMessage, description, label, transactionId, transactionDate, transactionTime, receiverEntity, phoneNumber, newBalance, transactionCost } = req.body;

  const dailyTransaction = await Transaction.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (dailyTransaction) {
    dailyTransaction.date = date || dailyTransaction.date;
    dailyTransaction.amount = amount || dailyTransaction.amount;
    dailyTransaction.method = method || dailyTransaction.method;
    dailyTransaction.transactionMessage = transactionMessage || dailyTransaction.transactionMessage;
    dailyTransaction.description = description || dailyTransaction.description;
    dailyTransaction.label = label || dailyTransaction.label;
    dailyTransaction.transactionId = transactionId || dailyTransaction.transactionId;
    dailyTransaction.transactionDate = transactionDate || dailyTransaction.transactionDate;
    dailyTransaction.transactionTime = transactionTime || dailyTransaction.transactionTime;
    dailyTransaction.receiverEntity = receiverEntity || dailyTransaction.receiverEntity;
    dailyTransaction.phoneNumber = phoneNumber || dailyTransaction.phoneNumber;
    dailyTransaction.newBalance = newBalance || dailyTransaction.newBalance;
    dailyTransaction.transactionCost = transactionCost || dailyTransaction.transactionCost;

    const updatedTransaction = await dailyTransaction.save();
    res.json(updatedTransaction);
  } else {
    res.status(404);
    throw new Error('Daily transaction not found');
  }
});

// @desc    Delete daily transaction
// @route   DELETE /api/daily-transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const dailyTransaction = await Transaction.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (dailyTransaction) {
    await dailyTransaction.deleteOne();
    res.json({ message: 'Daily transaction removed' });
  } else {
    res.status(404);
    throw new Error('Daily transaction not found');
  }
});

// @desc    Get daily transaction stats
// @route   GET /api/daily-transactions/stats
// @access  Private
const getTransactionStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const matchQuery = { tenant: req.user.tenant };

  const todayStats = await Transaction.aggregate([
    { $match: { date: { $gte: startOfToday }, ...matchQuery } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const weekStats = await Transaction.aggregate([
    { $match: { date: { $gte: startOfWeek }, ...matchQuery } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const monthStats = await Transaction.aggregate([
    { $match: { date: { $gte: startOfMonth }, ...matchQuery } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const yearStats = await Transaction.aggregate([
    { $match: { date: { $gte: startOfYear }, ...matchQuery } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  res.json({
    today: todayStats[0]?.total || 0,
    thisWeek: weekStats[0]?.total || 0,
    thisMonth: monthStats[0]?.total || 0,
    thisYear: yearStats[0]?.total || 0,
  });
});

// @desc    Get monthly transaction totals for a given year
// @route   GET /api/daily-transactions/monthly-totals
// @access  Private
const getMonthlyTransactionTotals = asyncHandler(async (req, res) => {
  const { year } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Please provide a year.');
  }

  const matchQuery = { tenant: req.user.tenant };

  matchQuery.date = {
    $gte: new Date(parseInt(year), 0, 1),
    $lt: new Date(parseInt(year) + 1, 0, 1),
  };

  const monthlyTotals = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { month: { $month: "$date" } },
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

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getMonthlyTransactionTotals,
};