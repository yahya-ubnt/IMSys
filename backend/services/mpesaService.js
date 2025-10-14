const axios = require('axios');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');
const ApplicationSettings = require('../models/ApplicationSettings'); // Import ApplicationSettings
const { reconnectMikrotikUser } = require('../utils/mikrotikUtils');
const { getDarajaToken } = require('../utils/darajaAuth');
const { DARAJA_ENV } = require('../config/env');

// Helper function to get M-Pesa configuration from the database
const getMpesaConfig = async (type, userId) => {
  const settings = await ApplicationSettings.findOne({ user: userId });
  if (type === 'paybill' && settings?.mpesaPaybill) {
    return {
      shortcode: settings.mpesaPaybill.paybillNumber,
      passkey: settings.mpesaPaybill.passkey,
      consumerKey: settings.mpesaPaybill.consumerKey,
      consumerSecret: settings.mpesaPaybill.consumerSecret,
    };
  }
  if (type === 'till' && settings?.mpesaTill) {
    return {
      shortcode: settings.mpesaTill.tillStoreNumber || settings.mpesaTill.tillNumber,
      passkey: settings.mpesaTill.passkey,
      consumerKey: settings.mpesaTill.consumerKey,
      consumerSecret: settings.mpesaTill.consumerSecret,
    };
  }
  // Fallback for STK push if no type is specified
  if (!type) {
    if (settings?.mpesaPaybill?.activated) return getMpesaConfig('paybill', userId);
    if (settings?.mpesaTill?.activated) return getMpesaConfig('till', userId);
  }
  throw new Error(`M-Pesa ${type || ''} is not configured.`);
};

const registerCallbackURL = async (type, userId) => {
  const config = await getMpesaConfig(type, userId);
  const token = await getDarajaToken(config.consumerKey, config.consumerSecret);

  const url = DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
    : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';

  const response = await axios.post(url, {
    ShortCode: config.shortcode,
    ResponseType: 'Completed',
    ConfirmationURL: `http://localhost:5000/api/payments/c2b-callback`,
    ValidationURL: `http://localhost:5000/api/payments/c2b-validation`,
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Update the activation status in the database
  const settings = await ApplicationSettings.findOne({ user: userId });
  if (type === 'paybill') {
    settings.mpesaPaybill.activated = true;
  } else if (type === 'till') {
    settings.mpesaTill.activated = true;
  }
  await settings.save();

  return response.data;
};


// A temporary in-memory store for STK requests.
// In a production environment, this should be a database table.
const pendingStkRequests = new Map();

const initiateStkPushService = async (amount, phoneNumber, accountReference, userId) => {
  const { shortcode, passkey } = await getMpesaConfig();
  const token = await getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const url = DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  const response = await axios.post(url, {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
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
    const user = await MikrotikUser.findOne({ username: accountReference }).populate('package');

    if (!user) {
      const alertMessage = `STK payment of KES ${transAmount} received for username '${accountReference}', but no user was found. (Receipt: ${transId})`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: accountReference, user: requestDetails.userId });
      throw new Error(alertMessage);
    }

    if (!user.package || !user.package.price || user.package.price <= 0) {
      const alertMessage = `STK payment of KES ${transAmount} for ${user.username} received, but user has no valid package price. Amount credited to wallet.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: accountReference, user: requestDetails.userId });
      await creditUserWallet(user._id, transAmount, 'M-Pesa', transId);
      return;
    }

    const packagePrice = user.package.price;
    const amountPaid = parseFloat(transAmount);

    const monthsPaid = Math.floor(amountPaid / packagePrice);
    const remainder = amountPaid % packagePrice;
    const daysToExtend = monthsPaid * 30;

    if (daysToExtend > 0) {
      const now = new Date();
      let newExpiryDate = new Date(user.expiryDate || now);

      if (newExpiryDate < now) {
        newExpiryDate = now;
      }

      newExpiryDate.setDate(newExpiryDate.getDate() + daysToExtend);
      user.expiryDate = newExpiryDate;
    }

    if (remainder > 0) {
      user.walletBalance += remainder;
      await WalletTransaction.create({
        user: user.user,
        mikrotikUser: user._id,
        transactionId: `WT-REMAINDER-${Date.now()}`,
        type: 'Credit',
        amount: remainder,
        source: 'Overpayment',
        balanceAfter: user.walletBalance,
        comment: `Remainder from M-Pesa payment ${transId}`,
        processedBy: null,
      });
    }

    await user.save();

    const reconnectionSuccessful = await reconnectMikrotikUser(user._id);

    if (!reconnectionSuccessful) {
      const alertMessage = `User ${user.officialName} (${user.username}) paid KES ${transAmount} via STK (Receipt: ${transId}), but automatic reconnection failed.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: accountReference, user: user.user });
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
        user: user.user,
      });
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

  const user = await MikrotikUser.findOne({ username: BillRefNumber }).populate('package');

  if (!user) {
    const alertMessage = `C2B payment of KES ${TransAmount} received from ${FirstName} ${LastName} (${MSISDN}) for username '${BillRefNumber}', but no user was found.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, user: user.user });
    throw new Error(alertMessage);
  }

  if (!user.package || !user.package.price || user.package.price <= 0) {
    const alertMessage = `C2B payment of KES ${TransAmount} for ${user.username} received, but user has no valid package price. Amount credited to wallet.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, user: user.user });
    await creditUserWallet(user._id, TransAmount, 'M-Pesa', TransID);
    return;
  }

  const packagePrice = user.package.price;
  const amountPaid = parseFloat(TransAmount);

  const monthsPaid = Math.floor(amountPaid / packagePrice);
  const remainder = amountPaid % packagePrice;
  const daysToExtend = monthsPaid * 30;

  if (daysToExtend > 0) {
    const now = new Date();
    let newExpiryDate = new Date(user.expiryDate || now);

    if (newExpiryDate < now) {
      newExpiryDate = now;
    }

    newExpiryDate.setDate(newExpiryDate.getDate() + daysToExtend);
    user.expiryDate = newExpiryDate;
  }

  if (remainder > 0) {
    user.walletBalance += remainder;
    await WalletTransaction.create({
      user: user.user,
      mikrotikUser: user._id,
      transactionId: `WT-REMAINDER-${Date.now()}`,
      type: 'Credit',
      amount: remainder,
      source: 'Overpayment',
      balanceAfter: user.walletBalance,
      comment: `Remainder from M-Pesa payment ${TransID}`,
      processedBy: null,
    });
  }

  await user.save();

  const reconnectionSuccessful = await reconnectMikrotikUser(user._id);

  if (!reconnectionSuccessful) {
    const alertMessage = `User ${user.officialName} (${user.username}) paid KES ${TransAmount} (Trans ID: ${TransID}), but automatic reconnection failed.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, user: user.user });
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
      user: user.user,
    });
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
    user: user.user, // SaaS user
    mikrotikUser: userId, // Mikrotik user
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
  registerCallbackURL,
};
