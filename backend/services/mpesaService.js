const axios = require('axios');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { getDarajaToken } = require('../utils/darajaAuth');
const { DARAJA_ENV, DARAJA_SHORTCODE, DARAJA_PASSKEY, DARAJA_CALLBACK_URL } = require('../config/env');

const getDarajaAxiosInstance = async () => {
  const accessToken = await getDarajaToken();
  return axios.create({
    baseURL: DARAJA_ENV === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

const initiateStkPushService = async (amount, phoneNumber, accountReference) => {
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
    CallBackURL: DARAJA_CALLBACK_URL, // Replace with your actual callback URL
    AccountReference: accountReference,
    TransactionDesc: 'Subscription Payment'
  };

  const darajaAxios = await getDarajaAxiosInstance();
  const response = await darajaAxios.post('/mpesa/stkpush/v1/processrequest', stkPushPayload);

  return response.data;
};

const registerCallbackURL = async (validationURL, confirmationURL) => {
  const darajaAxios = await getDarajaAxiosInstance();
  const response = await darajaAxios.post('/mpesa/c2b/v1/registerurl', {
    ShortCode: DARAJA_SHORTCODE,
    ResponseType: 'Completed',
    ConfirmationURL: confirmationURL,
    ValidationURL: validationURL
  });

  return response.data;
};

const processStkCallback = async (callbackData) => {
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  if (ResultCode !== 0) {
    console.error(`STK Push failed for ${CheckoutRequestID}: ${ResultDesc}`);
    return;
  }

  const metadata = CallbackMetadata.Item.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});

  const transAmount = metadata.Amount;
  const transId = metadata.MpesaReceiptNumber;
  const msisdn = metadata.PhoneNumber.toString();
  const user = await MikrotikUser.findOne({ mPesaRefNo: metadata.AccountReference });

  if (!user) {
    const alertMessage = `STK payment of KES ${transAmount} received for account '${metadata.AccountReference}', but no user was found.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: metadata.AccountReference });
    return;
  }

  await processSubscriptionPayment(user._id, transAmount, 'M-Pesa', transId);

  await Transaction.create({
    transactionId: transId,
    amount: transAmount,
    referenceNumber: user.username,
    officialName: user.officialName,
    msisdn: msisdn,
    transactionDate: new Date(),
    paymentMethod: 'M-Pesa',
    user: user.user,
  });
};

const processC2bCallback = async (callbackData) => {
  const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, MiddleName, LastName, OrgAccountBalance } = callbackData;

  if (!TransID) {
    console.log('C2B validation request or invalid callback. Ignoring.');
    return;
  }

  const user = await MikrotikUser.findOne({ mPesaRefNo: BillRefNumber });

  if (!user) {
    const alertMessage = `C2B payment of KES ${TransAmount} for '${BillRefNumber}' received, but no user was found.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber });
    return;
  }

  await processSubscriptionPayment(user._id, TransAmount, 'M-Pesa', TransID);

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
};

module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  registerCallbackURL,
};