const asyncHandler = require('express-async-handler');
const DailyTransaction = require('../models/DailyTransaction');
const moment = require('moment-timezone');
moment.tz.setDefault('Africa/Nairobi');

// @desc    Create new daily transaction
// @route   POST /api/daily-transactions
// @access  Private
const createDailyTransaction = asyncHandler(async (req, res) => {
  const { amount, method, transactionMessage, description, label, transactionId, transactionDate, transactionTime, receiverEntity, phoneNumber, newBalance, transactionCost, category } = req.body;

  if (!amount || !method || !transactionMessage || !description || !label || !category) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  const dailyTransaction = new DailyTransaction({
    date: new Date(),
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
    category,
  });

  const createdDailyTransaction = await dailyTransaction.save();
  console.log('Created Transaction:', createdDailyTransaction);
  res.status(201).json(createdDailyTransaction);
});

// @desc    Get all daily transactions
// @route   GET /api/daily-transactions
// @access  Private
const getDailyTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, method, label, search, category } = req.query;

  const query = {};

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
  if (category) {
    query.category = category;
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

  const dailyTransactions = await DailyTransaction.find(query).sort({ date: -1 });
  res.json(dailyTransactions);
});

// @desc    Get single daily transaction by ID
// @route   GET /api/daily-transactions/:id
// @access  Private
const getDailyTransactionById = asyncHandler(async (req, res) => {
  const dailyTransaction = await DailyTransaction.findById(req.params.id);

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
const updateDailyTransaction = asyncHandler(async (req, res) => {
  const { date, amount, method, transactionMessage, description, label, transactionId, transactionDate, transactionTime, receiverEntity, phoneNumber, newBalance, transactionCost, category } = req.body;

  const dailyTransaction = await DailyTransaction.findById(req.params.id);

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
    dailyTransaction.category = category || dailyTransaction.category;

    const updatedDailyTransaction = await dailyTransaction.save();
    res.json(updatedDailyTransaction);
  } else {
    res.status(404);
    throw new Error('Daily transaction not found');
  }
});

// @desc    Delete daily transaction
// @route   DELETE /api/daily-transactions/:id
// @access  Private
const deleteDailyTransaction = asyncHandler(async (req, res) => {
  const dailyTransaction = await DailyTransaction.findById(req.params.id);

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
const getDailyTransactionStats = asyncHandler(async (req, res) => {
  const today = moment().startOf('day');
  const startOfWeek = moment().startOf('week');
  const startOfMonth = moment().startOf('month');
  const startOfYear = moment().startOf('year');

  const stats = await DailyTransaction.aggregate([
    {
      $facet: {
        today: [
          { $match: { date: { $gte: today.toDate() } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ],
        thisWeek: [
          { $match: { date: { $gte: startOfWeek.toDate() } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ],
        thisMonth: [
          { $match: { date: { $gte: startOfMonth.toDate() } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ],
        thisYear: [
          { $match: { date: { $gte: startOfYear.toDate() } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]
      }
    }
  ]);

  const formatStats = (data) => {
    const personal = data.find(d => d._id === 'Personal')?.total || 0;
    const company = data.find(d => d._id === 'Company')?.total || 0;
    return { personal, company, total: personal + company };
  };

  res.json({
    today: formatStats(stats[0].today),
    thisWeek: formatStats(stats[0].thisWeek),
    thisMonth: formatStats(stats[0].thisMonth),
    thisYear: formatStats(stats[0].thisYear),
  });
});

// @desc    Get monthly transaction totals for a given year
// @route   GET /api/daily-transactions/monthly-totals
// @access  Private
const getMonthlyTransactionTotals = asyncHandler(async (req, res) => {
  const { year, category } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Please provide a year.');
  }

  const matchQuery = category ? { category, date: {
    $gte: new Date(parseInt(year), 0, 1),
    $lt: new Date(parseInt(year) + 1, 0, 1),
  }} : { date: {
    $gte: new Date(parseInt(year), 0, 1),
    $lt: new Date(parseInt(year) + 1, 0, 1),
  }};

  const monthlyTotals = await DailyTransaction.aggregate([
    {
      $match: matchQuery,
    },
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


// @desc    Get daily collection totals for a given month and year
// @route   GET /api/daily-transactions/daily-collection-totals
// @access  Private
const getDailyCollectionTotals = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    res.status(400);
    throw new Error('Please provide a year and month.');
  }

  const startDate = moment(`${year}-${month}-01`).startOf('month');
  const endDate = moment(startDate).endOf('month');
  const daysInMonth = endDate.date();

  const dailyTotals = await DailyTransaction.aggregate([
    {
      $match: {
        date: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      },
    },
    {
      $group: {
        _id: { day: { $dayOfMonth: '$date' } },
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
  createDailyTransaction,
  getDailyTransactions,
  getDailyTransactionById,
  updateDailyTransaction,
  deleteDailyTransaction,
  getDailyTransactionStats,
  getMonthlyTransactionTotals,
  getDailyCollectionTotals,
};
  
  