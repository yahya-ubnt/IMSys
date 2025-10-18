const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');

// @desc    Get location-based revenue report
// @route   POST /api/reports/location
// @access  Private
const getLocationReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, apartment_house_number } = req.body;

  if (!startDate || !endDate || !apartment_house_number) {
    res.status(400);
    throw new Error('Please provide start date, end date, and an apartment/house number.');
  }

  const mikrotikUsers = await MikrotikUser.find({
    tenantOwner: req.user.tenantOwner,
    apartment_house_number: apartment_house_number,
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).populate('package', 'price');

  if (!mikrotikUsers || mikrotikUsers.length === 0) {
    res.json({
      reportData: [],
      totalAmount: 0,
      message: 'No user records found for the selected criteria.',
    });
    return;
  }

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
  const alerts = await MpesaAlert.find({ tenantOwner: req.user.tenantOwner }).sort({ createdAt: -1 });
  res.status(200).json(alerts);
});

// @desc    Delete an M-Pesa alert
// @route   DELETE /api/reports/mpesa-alerts/:id
// @access  Private
const deleteMpesaAlert = asyncHandler(async (req, res) => {
  const alert = await MpesaAlert.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (alert) {
    await alert.deleteOne();
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { startDate, endDate } = req.body;

  const transactions = await Transaction.find({
    tenantOwner: req.user.tenantOwner, // Filter by tenant
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