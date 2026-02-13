const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const MikrotikUser = require('../models/MikrotikUser');
const PaymentService = require('../services/paymentService');
const { initiateStkPushService } = require('../services/mpesaService');

// ... (initiateStkPush and handleDarajaCallback logic remains same, but calls PaymentService)

const initiateStkPush = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, phoneNumber, accountReference } = req.body;

  try {
    const response = await initiateStkPushService(req.user.tenant, amount, phoneNumber, accountReference);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error initiating STK push:', error);
    res.status(500).json({ message: 'Failed to initiate STK push.' });
  }
});

const handleDarajaCallback = asyncHandler(async (req, res) => {
  const safaricomIps = ['196.201.214.200', '196.201.214.206', '196.201.214.207', '196.201.214.208'];
  const requestIp = req.ip;
  if (!safaricomIps.includes(requestIp)) {
    console.warn(`[SECURITY] Callback from untrusted IP rejected: ${requestIp}`);
    return res.status(403).json({ message: 'Untrusted source' });
  }

  console.log(`[${new Date().toISOString()}] M-Pesa Callback Received:`, JSON.stringify(req.body, null, 2));

  // The processStkCallback and processC2bCallback already use PaymentService internally now
  const { processStkCallback, processC2bCallback } = require('../services/mpesaService');

  try {
    if (req.body.Body && req.body.Body.stkCallback) {
      await processStkCallback(req.body.Body.stkCallback);
    } else if (req.body.TransID) {
      await processC2bCallback(req.body);
    }

    res.status(200).json({ "ResultCode": 0, "ResultDesc": "Accepted" });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in handleDarajaCallback:`, error);
    res.status(500).json({ "ResultCode": 1, "ResultDesc": "Internal Server Error" });
  }
});

const getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, search, page = 1, limit = 10 } = req.query;
  const query = { tenant: req.user.tenant };

  if (startDate && endDate) {
    query.transactionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } },
      { officialName: { $regex: search, $options: 'i' } },
      { msisdn: { $regex: search, $options: 'i' } },
    ];
  }

  const transactions = await Transaction.find(query)
    .sort({ transactionDate: -1 })
    .limit(parseInt(limit))
    .skip((page - 1) * parseInt(limit))
    .populate('mikrotikUser', 'username officialName');

  const count = await Transaction.countDocuments(query);

  res.status(200).json({ 
    transactions, 
    pages: Math.ceil(count / limit), 
    count 
  });
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const { userId, type, startDate, endDate, searchTerm, page = 1, limit = 10 } = req.query;
  const query = { tenant: req.user.tenant };
  
  const targetUserId = userId || req.params.userId;
  if (targetUserId) {
    query.mikrotikUser = targetUserId;
  }

  if (type) {
    query.type = type;
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (searchTerm) {
    query.$or = [
      { transactionId: { $regex: searchTerm, $options: 'i' } },
      { source: { $regex: searchTerm, $options: 'i' } },
      { comment: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const transactions = await WalletTransaction.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((page - 1) * parseInt(limit))
    .populate('mikrotikUser', 'username officialName')
    .populate('processedBy', 'fullName');

  const count = await WalletTransaction.countDocuments(query);
    
  res.status(200).json({
    transactions,
    pages: Math.ceil(count / limit),
    count
  });
});

const getWalletTransactionById = asyncHandler(async (req, res) => {
  const transaction = await WalletTransaction.findOne({
    _id: req.params.id,
    tenant: req.user.tenant,
  }).populate('mikrotikUser', 'username officialName').populate('processedBy', 'fullName');

  if (!transaction) {
    res.status(404);
    throw new Error('Wallet transaction not found');
  }

  res.status(200).json(transaction);
});

const createCashPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { userId, amount, comment } = req.body;
  const transactionId = `CASH-${randomUUID()}`;

  await PaymentService.handleSuccessfulPayment({
    tenant: req.user.tenant,
    amount: parseFloat(amount),
    transactionId,
    reference: (await MikrotikUser.findById(userId)).username,
    paymentMethod: 'Cash',
    officialName: null, // Fetched by service
    comment,
  });

  res.status(201).json({ success: true, transactionId });
});

const createWalletTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const transaction = await PaymentService.createWalletTransaction({
    ...req.body,
    tenant: req.user.tenant
  }, req.user._id);

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