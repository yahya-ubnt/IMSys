const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const axios = require('axios');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { DARAJA_ENV, DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_SHORTCODE, DARAJA_PASSKEY } = require('../config/env');

const getDarajaAxiosInstance = async () => {
  const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(
    `https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    }
  );
  const accessToken = response.data.access_token;

  return axios.create({
    baseURL: DARAJA_ENV === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

const initiateStkPush = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, phoneNumber, accountReference } = req.body;
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');

  const stkPushPayload = {
    BusinessShortCode: DARAJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: DARAJA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `https://your-callback-url.com/api/payments/daraja-callback`, // Replace with your actual callback URL
    AccountReference: accountReference,
    TransactionDesc: 'Subscription Payment'
  };

  const darajaAxios = await getDarajaAxiosInstance();
  const response = await darajaAxios.post('/mpesa/stkpush/v1/processrequest', stkPushPayload);

  res.status(200).json(response.data);
});

const handleDarajaCallback = asyncHandler(async (req, res) => {
  console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

  const { Body } = req.body;
  if (Body && Body.stkCallback && Body.stkCallback.ResultCode === 0) {
    const { MpesaReceiptNumber, Amount, PhoneNumber } = Body.stkCallback.CallbackMetadata.Item.reduce((acc, item) => {
      acc[item.Name] = item.Value;
      return acc;
    }, {});

    const transaction = await Transaction.create({
      transactionId: MpesaReceiptNumber,
      amount: Amount,
      referenceNumber: Body.stkCallback.CheckoutRequestID,
      officialName: '', // You might want to get this from the user who initiated the payment
      msisdn: PhoneNumber,
      transactionDate: new Date(),
      paymentMethod: 'M-Pesa',
      comment: 'STK Push Payment',
      user: null // You need to associate this with a user
    });

    // Find the user by phone number and process the payment
    const user = await MikrotikUser.findOne({ mobileNumber: PhoneNumber });
    if (user) {
      await processSubscriptionPayment(user._id, Amount, 'M-Pesa', MpesaReceiptNumber, null);
    }
  }

  res.status(200).send('Callback received');
});

const getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, searchTerm, startDate, endDate } = req.query;

  const query = {};

  if (searchTerm) {
    query.$or = [
      { officialName: { $regex: searchTerm, $options: 'i' } },
      { referenceNumber: { $regex: searchTerm, $options: 'i' } },
      { msisdn: { $regex: searchTerm, $options: 'i' } },
      { transactionId: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (startDate && endDate) {
    query.transactionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const transactions = await Transaction.find(query)
    .sort({ transactionDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json(transactions);
});

const createCashPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, amount, transactionId, comment } = req.body;
  const amountPaid = parseFloat(amount);

  const user = await MikrotikUser.findById(userId);
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
    user: req.user._id,
  });

  res.status(201).json(transaction);
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(transactions);
});

const getWalletTransactionById = asyncHandler(async (req, res) => {
  const transaction = await WalletTransaction.findById(req.params.id);

  if (transaction && transaction.user.toString() === req.user._id.toString()) {
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
    user: userId,
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