const asyncHandler = require('express-async-handler');
const MikrotikUser = require('../models/MikrotikUser');
const Building = require('../models/Building');
const Package = require('../models/Package');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');

// @desc    Get location-based revenue report
// @route   POST /api/reports/location
// @access  Private
const getLocationReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, buildingId } = req.body;

  if (!startDate || !endDate || !buildingId) {
    res.status(400);
    throw new Error('Please provide start date, end date, and a building ID.');
  }

  // 1. Find the building to get its name
  const building = await Building.findById(buildingId);
  if (!building) {
    res.status(404);
    throw new Error('Building not found');
  }
  const buildingName = building.name;

  // 2. Find all Mikrotik users in that building within the date range
  const mikrotikUsers = await MikrotikUser.find({
    buildingName: buildingName,
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).populate('package', 'price'); // Populate the price from the package

  if (!mikrotikUsers || mikrotikUsers.length === 0) {
    res.json({
      reportData: [],
      totalAmount: 0,
      message: 'No user records found for the selected criteria.',
    });
    return;
  }

  // 3. Process the records to generate the report
  let totalAmount = 0;
  const reportData = mikrotikUsers.map((user, index) => {
    const amount = user.package ? user.package.price : 0;
    totalAmount += amount;
    return {
      SN: index + 1,
      'Official Name': user.officialName,
      'Total Amount': amount,
      Type: user.serviceType,
      'Reference Number': user.mPesaRefNo,
    };
  });

  res.status(200).json({ reportData, totalAmount });
});



// @desc    Get all M-Pesa alerts
// @route   GET /api/reports/mpesa-alerts
// @access  Private
const getMpesaAlerts = asyncHandler(async (req, res) => {
  const alerts = await MpesaAlert.find({}).sort({ createdAt: -1 });
  res.status(200).json(alerts);
});

// @desc    Delete an M-Pesa alert
// @route   DELETE /api/reports/mpesa-alerts/:id
// @access  Private
const deleteMpesaAlert = asyncHandler(async (req, res) => {
  const alert = await MpesaAlert.findById(req.params.id);

  if (alert) {
    await alert.remove();
    res.json({ message: 'Alert removed' });
  } else {
    res.status(404);
    throw new Error('Alert not found');
  }
});

// @desc    Get M-Pesa report
// @route   POST /api/reports/mpesa-report
// @access  Private
const getMpesaReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start date and end date.');
  }

  const transactions = await Transaction.find({
    user: req.user._id, // Filter by user
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ transactionDate: -1 });

  const totalAmount = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const reportData = transactions.map((transaction, index) => ({
    Number: index + 1,
    'Transaction ID': transaction.transactionId,
    'Official Name': transaction.officialName,
    Amount: transaction.amount,
    'Date & Time': transaction.transactionDate.toLocaleString(),
  }));

  res.status(200).json({ reportData, totalAmount });
});

module.exports = {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
};