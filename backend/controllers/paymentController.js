const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const MikrotikUser = require('../models/MikrotikUser');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { initiateStkPushService, processStkCallback, processC2bCallback } = require('../services/mpesaService');

const initiateStkPush = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, phoneNumber, accountReference } = req.body;

  try {
    // Pass the logged-in user's tenant ID to the service
    const response = await initiateStkPushService(req.user.tenant, amount, phoneNumber, accountReference);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error initiating STK push:', error);
    res.status(500).json({ message: 'Failed to initiate STK push.' });
  }
});

const handleDarajaCallback = asyncHandler(async (req, res) => {
  console.log(`[${new Date().toISOString()}] M-Pesa Callback Received:`, JSON.stringify(req.body, null, 2));

  try {
    // Check if it's an STK Push callback
    if (req.body.Body && req.body.Body.stkCallback) {
      console.log(`[${new Date().toISOString()}] Processing STK Push callback.`);
      await processStkCallback(req.body.Body.stkCallback);
    } 
    // Check if it's a C2B confirmation or validation
    else if (req.body.TransID) {
      console.log(`[${new Date().toISOString()}] Processing C2B callback.`);
      await processC2bCallback(req.body);
    } 
    // Otherwise, it's a callback we don't handle
    else {
      console.log(`[${new Date().toISOString()}] Received a callback that is not a standard STK or C2B payload.`);
    }

    // Respond to Safaricom acknowledging receipt
    res.status(200).json({
      "ResultCode": 0,
      "ResultDesc": "Accepted"
    });
    console.log(`[${new Date().toISOString()}] M-Pesa callback successfully processed and acknowledged.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in handleDarajaCallback:`, error);
    res.status(500).json({
      "ResultCode": 1,
      "ResultDesc": "Internal Server Error"
    });
  }
});

const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, searchTerm, startDate, endDate, userId } = req.query;

  const query = { tenant: req.user.tenant };

  if (userId) {
    try {
      const mikrotikUser = await MikrotikUser.findById(userId);
      if (mikrotikUser) {
        query.mikrotikUser = mikrotikUser._id;
      } else {
        return res.status(200).json({ transactions: [], pages: 0, stats: { totalVolume: 0, transactionCount: 0, averageTransaction: 0 } });
      }
    } catch (error) {
      console.error('Error fetching Mikrotik user:', error);
      return res.status(500).json({ message: 'Error fetching user data.' });
    }
  }

  if (searchTerm) {
    query.$or = [
      { officialName: { $regex: searchTerm, $options: 'i' } },
      { referenceNumber: { $regex: searchTerm, $options: 'i' } },
      { msisdn: { $regex: searchTerm, 'options': 'i' } },
      { transactionId: { $regex: searchTerm, 'options': 'i' } },
    ];
  }

  if (startDate && endDate) {
    query.transactionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const totalCount = await Transaction.countDocuments(query);
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  const transactions = await Transaction.find(query)
    .sort({ transactionDate: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const totalVolumeResult = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, totalVolume: { $sum: '$amount' } } },
  ]);

  const totalVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].totalVolume : 0;
  const transactionCount = totalCount;
  const averageTransaction = transactionCount > 0 ? totalVolume / transactionCount : 0;

  res.status(200).json({
    transactions,
    pages: totalPages,
    stats: {
      totalVolume,
      transactionCount,
      averageTransaction,
    },
  });
});

const createCashPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, amount, transactionId, comment } = req.body;
  const amountPaid = parseFloat(amount);

  const user = await MikrotikUser.findOne({ _id: userId, tenant: req.user.tenant });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await processSubscriptionPayment(userId, amountPaid, 'Cash', transactionId, req.user._id);

  const transaction = await Transaction.create({
    transactionId,
    amount: amountPaid,
    referenceNumber: user.username,
    officialName: user.officialName,
    msisdn: user.mobileNumber,
    transactionDate: new Date(),
    paymentMethod: 'Cash',
    comment,
    tenant: req.user.tenant,
  });

  res.status(201).json(transaction);
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  if (req.params.id) {
    query.mikrotikUser = req.params.id;
  }
  const transactions = await WalletTransaction.find(query).sort({ createdAt: -1 });
  res.status(200).json(transactions);
});

const getWalletTransactionById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const transaction = await WalletTransaction.findOne(query);

  if (transaction) {
    res.status(200).json(transaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

const createWalletTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, type, amount, source, comment, transactionId } = req.body;

  const transaction = await WalletTransaction.create({
    tenant: req.user.tenant,
    mikrotikUser: userId,
    type,
    amount,
    source,
    comment,
    transactionId,
    balanceAfter: 0 // This should be calculated based on the user's wallet balance
  });

  res.status(201).json(transaction);
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