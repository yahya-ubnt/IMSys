const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const { reconnectMikrotikUser } = require('../utils/mikrotikUtils');
const {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  creditUserWallet,
} = require('../services/mpesaService');

// @desc    Initiate STK Push
// @route   POST /api/payments/initiate-stk
// @access  Private
const initiateStkPush = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, phoneNumber, accountReference } = req.body;
  const userId = req.user._id;

  try {
    const responseData = await initiateStkPushService(amount, phoneNumber, accountReference, userId);
    res.status(200).json({
      message: responseData.ResponseDescription,
      checkoutRequestID: responseData.CheckoutRequestID,
    });
  } catch (error) {
    console.error('Error initiating STK push:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Failed to initiate STK push.' });
  }
});
// @desc    Handle Daraja C2B and STK Callbacks
// @route   POST /api/payments/daraja-callback
// @access  Public
const handleDarajaCallback = asyncHandler(async (req, res) => {
  console.log('--- Daraja Callback Received ---');
  console.log(JSON.stringify(req.body, null, 2));

  // Acknowledge receipt immediately
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    // Check if it's an STK Push callback
    if (req.body.Body && req.body.Body.stkCallback) {
      await processStkCallback(req.body.Body.stkCallback);
    } else {
      // Assume it's a C2B callback
      await processC2bCallback(req.body);
    }
  } catch (error) {
    console.error('Error processing Daraja callback:', error.message);
    // We've already sent a 200 response, so we just log the error
  }
});

// @desc    Get all transactions
// @route   GET /api/payments/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({}).sort({ createdAt: -1 });
  res.status(200).json(transactions);
});

// @desc    Create a cash payment
// @route   POST /api/payments/cash
// @access  Private
const createCashPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, amount, transactionId, comment } = req.body;

  const user = await MikrotikUser.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Process payment - extend expiry and reconnect
  const now = new Date();
  let newExpiryDate = new Date(user.expiryDate || now);

  // If the expiry date is in the past, start the new subscription from today
  if (newExpiryDate < now) {
    newExpiryDate = now;
  }

  newExpiryDate.setDate(newExpiryDate.getDate() + 30);
  user.expiryDate = newExpiryDate;
  await user.save();

  await reconnectMikrotikUser(user._id);

  // Create transaction record
  const transaction = await Transaction.create({
    transactionId,
    amount,
    referenceNumber: user.username, // Use username as the reference for cash payments
    officialName: user.officialName,
    msisdn: user.mobileNumber,
    transactionDate: new Date(),
    paymentMethod: 'Cash',
    comment,
    user: req.user._id, // Associate with the logged-in user
  });

  await creditUserWallet(user._id, amount, 'Cash', transactionId, req.user._id);

  res.status(201).json(transaction);
});

// @desc    Get all wallet transactions
// @route   GET /api/payments/wallet
// @access  Private
const getWalletTransactions = asyncHandler(async (req, res) => {
  const { userId, type, startDate, endDate } = req.query;
  const filter = {};

  if (userId) filter.userId = userId;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const transactions = await WalletTransaction.find(filter)
    .populate('userId', 'officialName username') // Populate user details
    .populate('processedBy', 'name') // Populate admin user details
    .sort({ createdAt: -1 });

  res.status(200).json(transactions);
});

// @desc    Get single wallet transaction by ID
// @route   GET /api/payments/wallet/:id
// @access  Private
const getWalletTransactionById = asyncHandler(async (req, res) => {
  const transaction = await WalletTransaction.findById(req.params.id)
    .populate('userId', 'officialName username')
    .populate('processedBy', 'name');

  if (!transaction) {
    res.status(404);
    throw new Error('Wallet transaction not found');
  }

  res.status(200).json(transaction);
});

// @desc    Create a manual wallet transaction (Credit/Debit/Adjustment)
// @route   POST /api/payments/wallet
// @access  Private (Admin only)
const createWalletTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, type, amount, source, comment, transactionId } = req.body;

  const user = await MikrotikUser.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let newBalance = user.walletBalance;
  if (type === 'Credit') {
    newBalance += amount;
  } else if (type === 'Debit') {
    newBalance -= amount;
  } else if (type === 'Adjustment') {
    // For adjustment, the amount can be positive or negative
    newBalance += amount;
  } else {
    res.status(400);
    throw new Error('Invalid transaction type');
  }

  user.walletBalance = newBalance;
  await user.save();

  const walletTransaction = await WalletTransaction.create({
    user: req.user._id, // Associate with the logged-in user
    mikrotikUser: userId, // Associate with the Mikrotik user
    transactionId: transactionId || `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    amount,
    source,
    balanceAfter: newBalance,
    comment,
    processedBy: req.user._id, // The logged-in admin user
  });

  res.status(201).json(walletTransaction);
});

module.exports = {
  initiateStkPush,
  handleDarajaCallback,
  getTransactions,
  createCashPayment,
  getWalletTransactions,
  getWalletTransactionById,
  createWalletTransaction,
};
