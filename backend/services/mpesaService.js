const axios = require('axios');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const { reconnectMikrotikUser } = require('../utils/mikrotikUtils');
const { getDarajaToken } = require('../utils/darajaAuth');
const { DARAJA_ENV, DARAJA_SHORTCODE, DARAJA_PASSKEY } = require('../config/env');

// A temporary in-memory store for STK requests.
// In a production environment, this should be a database table.
const pendingStkRequests = new Map();

const initiateStkPushService = async (amount, phoneNumber, accountReference, userId) => {
  const token = await getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');

  const url = DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  const response = await axios.post(url, {
    BusinessShortCode: DARAJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: DARAJA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `http://localhost:5000/api/payments/daraja-callback`,
    AccountReference: accountReference,
    TransactionDesc: `Payment for ${accountReference}`
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { CheckoutRequestID } = response.data;

  if (CheckoutRequestID) {
    pendingStkRequests.set(CheckoutRequestID, { userId, accountReference, amount });
  }

  return response.data;
};

const processStkCallback = async (callbackData) => {
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  if (ResultCode !== 0) {
    console.error(`STK Push failed for CheckoutRequestID ${CheckoutRequestID}. Reason: ${ResultDesc}`);
    pendingStkRequests.delete(CheckoutRequestID);
    return;
  }

  const requestDetails = pendingStkRequests.get(CheckoutRequestID);
  if (!requestDetails) {
    throw new Error(`Could not find pending STK request for CheckoutRequestID: ${CheckoutRequestID}`);
  }

  const metadata = CallbackMetadata.Item.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});

  const transAmount = metadata.Amount;
  const transId = metadata.MpesaReceiptNumber;
  const msisdn = metadata.PhoneNumber.toString();
  const { accountReference } = requestDetails;

  try {
    const user = await MikrotikUser.findOne({ username: accountReference });

    if (!user) {
      const alertMessage = `STK payment of KES ${transAmount} received for username '${accountReference}', but no user was found. (Receipt: ${transId})`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: accountReference });
      throw new Error(alertMessage);
    }

    const newExpiryDate = new Date(user.expiryDate || new Date());
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
    user.expiryDate = newExpiryDate;
    await user.save();

    const reconnectionSuccessful = await reconnectMikrotikUser(user._id);

    if (!reconnectionSuccessful) {
      const alertMessage = `User ${user.officialName} (${user.username}) paid KES ${transAmount} via STK (Receipt: ${transId}), but automatic reconnection failed.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: accountReference });
      console.error(alertMessage);
    } else {
      console.log(`Successfully processed STK payment and reconnected user ${user.username}`);
      await Transaction.create({
        transactionId: transId,
        amount: transAmount,
        referenceNumber: accountReference,
        officialName: user.officialName,
        msisdn: msisdn,
        transactionDate: new Date(),
        paymentMethod: 'M-Pesa',
      });
      await creditUserWallet(user._id, transAmount, 'M-Pesa', transId);
    }
  } finally {
    pendingStkRequests.delete(CheckoutRequestID);
  }
};

const processC2bCallback = async (callbackData) => {
  const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, MiddleName, LastName, OrgAccountBalance } = callbackData;

  if (!TransID) {
    console.log('C2B validation request or invalid callback. Ignoring.');
    return;
  }

  const user = await MikrotikUser.findOne({ username: BillRefNumber });

  if (!user) {
    const alertMessage = `C2B payment of KES ${TransAmount} received from ${FirstName} ${LastName} (${MSISDN}) for username '${BillRefNumber}', but no user was found.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber });
    throw new Error(alertMessage);
  }

  const newExpiryDate = new Date(user.expiryDate || new Date());
  newExpiryDate.setDate(newExpiryDate.getDate() + 30);
  user.expiryDate = newExpiryDate;
  await user.save();

  const reconnectionSuccessful = await reconnectMikrotikUser(user._id);

  if (!reconnectionSuccessful) {
    const alertMessage = `User ${user.officialName} (${user.username}) paid KES ${TransAmount} (Trans ID: ${TransID}), but automatic reconnection failed.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber });
    console.error(alertMessage);
  } else {
    console.log(`Successfully processed C2B payment and reconnected user ${user.username}`);
    await Transaction.create({
      transactionId: TransID,
      amount: TransAmount,
      referenceNumber: BillRefNumber,
      officialName: `${FirstName} ${LastName}`.trim(),
      msisdn: MSISDN,
      balance: OrgAccountBalance,
      transactionDate: new Date(),
      paymentMethod: 'M-Pesa',
    });
    await creditUserWallet(user._id, TransAmount, 'M-Pesa', TransID);
  }
};

// Helper function to credit a user's wallet
const creditUserWallet = async (userId, amount, source, externalTransactionId, adminId = null) => {
  const user = await MikrotikUser.findById(userId);
  if (!user) throw new Error('User not found for wallet credit');

  const newBalance = user.walletBalance + amount;
  user.walletBalance = newBalance;
  await user.save();

  await WalletTransaction.create({
    userId,
    transactionId: `WT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Credit',
    amount,
    source,
    balanceAfter: newBalance,
    comment: `Credit from ${source} transaction: ${externalTransactionId}`,
    processedBy: adminId,
  });
};


module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  creditUserWallet,
};
