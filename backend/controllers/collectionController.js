const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const moment = require('moment-timezone');
moment.tz.setDefault('Africa/Nairobi');

// @desc    Get all collections
// @route   GET /api/collections
// @access  Private
const getCollections = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };
  const collections = await Transaction.find(query).sort({ transactionDate: -1 });
  res.json(collections);
});

// @desc    Get collection stats
// @route   GET /api/collections/stats
// @access  Private
const getCollectionStats = asyncHandler(async (req, res) => {
  const today = moment().startOf('day');
  const startOfWeek = moment().startOf('week');
  const startOfMonth = moment().startOf('month');
  const startOfYear = moment().startOf('year');

  const matchQuery = { tenant: req.user.tenant };

  const stats = await Transaction.aggregate([
    { $match: matchQuery }, 
    {
      $facet: {
        today: [
          { $match: { transactionDate: { $gte: today.toDate() } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ],
        thisWeek: [
          { $match: { transactionDate: { $gte: startOfWeek.toDate() } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ],
        thisMonth: [
          { $match: { transactionDate: { $gte: startOfMonth.toDate() } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ],
        thisYear: [
          { $match: { transactionDate: { $gte: startOfYear.toDate() } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]
      }
    }
  ]);

  const responseJson = {
    today: stats[0].today[0]?.total || 0,
    thisWeek: stats[0].thisWeek[0]?.total || 0,
    thisMonth: stats[0].thisMonth[0]?.total || 0,
    thisYear: stats[0].thisYear[0]?.total || 0,
  };

  res.json(responseJson);
});

// @desc    Get monthly collection totals for a given year
// @route   GET /api/collections/monthly-totals
// @access  Private
const getMonthlyCollectionTotals = asyncHandler(async (req, res) => {
  const { year } = req.query;

  if (!year) {
    res.status(400);
    throw new Error('Please provide a year.');
  }

  const matchQuery = { tenant: req.user.tenant };

  const monthlyTotals = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $match: {
        transactionDate: {
          $gte: new Date(parseInt(year), 0, 1),
          $lt: new Date(parseInt(year) + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$transactionDate" } },
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
// @route   GET /api/collections/daily-totals
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

  const matchQuery = { tenant: req.user.tenant };

  const dailyTotals = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $match: {
        transactionDate: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      },
    },
    {
      $group: {
        _id: { day: { $dayOfMonth: '$transactionDate' } },
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
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
};