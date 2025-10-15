const axios = require('axios');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const ApplicationSettings = require('../models/ApplicationSettings'); // Import ApplicationSettings
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { DARAJA_CALLBACK_URL } = require('../config/env');

/**
 * Fetches M-Pesa credentials for a specific user from the database.
 * @param {string} userId - The ID of the user/tenant.
 * @returns {object} The M-Pesa credentials.
 */
const getTenantMpesaCredentials = async (userId) => {
  const settings = await ApplicationSettings.findOne({ user: userId });
  if (!settings || !settings.mpesaPaybill || !settings.mpesaPaybill.consumerKey) {
    throw new Error(`M-Pesa settings not configured for user ${userId}`);
  }
  // Assuming paybill is the primary configuration for STK
  return settings.mpesaPaybill;
};

/**
 * Creates a Daraja API Axios instance configured for a specific tenant.
 * @param {string} userId - The ID of the user/tenant.
 * @returns {axios.AxiosInstance} An Axios instance configured with the tenant's credentials.
 */
const getDarajaAxiosInstance = async (userId) => {
  const credentials = await getTenantMpesaCredentials(userId);

  const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
  const url = (credentials.environment || 'sandbox') === 'production' 
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const tokenResponse = await axios.get(url, { headers: { 'Authorization': `Basic ${auth}` } });
  const accessToken = tokenResponse.data.access_token;

  const baseURL = (credentials.environment || 'sandbox') === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';

  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Initiates an STK push for a specific tenant.
 * @param {string} userId - The ID of the tenant.
 * @param {number} amount - The amount to charge.
 * @param {string} phoneNumber - The customer's phone number.
 * @param {string} accountReference - The customer's account reference.
 * @returns {object} The response from the Daraja API.
 */
const initiateStkPushService = async (userId, amount, phoneNumber, accountReference) => {
  const credentials = await getTenantMpesaCredentials(userId);
  const darajaAxios = await getDarajaAxiosInstance(userId);
  
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(`${credentials.paybillNumber}${credentials.passkey}${timestamp}`).toString('base64');

  const stkPushPayload = {
    BusinessShortCode: credentials.paybillNumber,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: credentials.paybillNumber,
    PhoneNumber: phoneNumber,
    CallBackURL: DARAJA_CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: 'Subscription Payment'
  };

  const response = await darajaAxios.post('/mpesa/stkpush/v1/processrequest', stkPushPayload);
  return response.data;
};

/**
 * Registers the C2B callback URLs for a specific tenant.
 * @param {string} userId - The ID of the tenant.
 * @returns {object} The response from the Daraja API.
 */
const registerCallbackURL = async (userId) => {
  const credentials = await getTenantMpesaCredentials(userId);
  const darajaAxios = await getDarajaAxiosInstance(userId);

  // These URLs should ideally be tenant-specific if the routing structure supports it
  const confirmationURL = DARAJA_CALLBACK_URL;
  const validationURL = DARAJA_CALLBACK_URL; // Using the same for simplicity

  const response = await darajaAxios.post('/mpesa/c2b/v1/registerurl', {
    ShortCode: credentials.paybillNumber,
    ResponseType: 'Completed',
    ConfirmationURL: confirmationURL,
    ValidationURL: validationURL
  });

  return response.data;
};

// --- Callback Processing (Remains mostly the same, as it doesn't initiate API calls) ---

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