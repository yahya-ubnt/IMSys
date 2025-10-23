const axios = require('axios');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const ApplicationSettings = require('../models/ApplicationSettings');
const StkRequest = require('../models/StkRequest');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { DARAJA_CALLBACK_URL } = require('../config/env');
const { formatPhoneNumber } = require('../utils/formatters');

const getTenantMpesaCredentials = async (tenantOwner) => {
  const settings = await ApplicationSettings.findOne({ tenantOwner });
  if (!settings || !settings.mpesaPaybill || !settings.mpesaPaybill.consumerKey) {
    throw new Error(`M-Pesa settings not configured for tenant ${tenantOwner}`);
  }
  return settings.mpesaPaybill;
};

const getDarajaAxiosInstance = async (tenantOwner) => {
  const credentials = await getTenantMpesaCredentials(tenantOwner);
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

const initiateStkPushService = async (tenantOwner, amount, phoneNumber, accountReference) => {
  const credentials = await getTenantMpesaCredentials(tenantOwner);
  const darajaAxios = await getDarajaAxiosInstance(tenantOwner);
  
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(`${credentials.paybillNumber}${credentials.passkey}${timestamp}`).toString('base64');
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

  const stkPushPayload = {
    BusinessShortCode: credentials.paybillNumber,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: formattedPhoneNumber,
    PartyB: credentials.paybillNumber,
    PhoneNumber: formattedPhoneNumber,
    CallBackURL: credentials.callbackURL || DARAJA_CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: 'Subscription Payment'
  };

  const response = await darajaAxios.post('/mpesa/stkpush/v1/processrequest', stkPushPayload);

  await StkRequest.create({
    tenantOwner,
    checkoutRequestId: response.data.CheckoutRequestID,
    accountReference,
  });

  return response.data;
};

const registerCallbackURL = async (tenantOwner) => {
  const credentials = await getTenantMpesaCredentials(tenantOwner);
  const darajaAxios = await getDarajaAxiosInstance(tenantOwner);

  const callbackUrl = credentials.callbackURL || DARAJA_CALLBACK_URL;

  const response = await darajaAxios.post('/mpesa/c2b/v1/registerurl', {
    ShortCode: credentials.paybillNumber,
    ResponseType: 'Completed',
    ConfirmationURL: callbackUrl,
    ValidationURL: callbackUrl
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

  const transId = metadata.MpesaReceiptNumber;
  const existingTransaction = await Transaction.findOne({ transactionId: transId });
  if (existingTransaction) {
    console.log(`Transaction ${transId} already processed.`);
    return;
  }

  const stkRequest = await StkRequest.findOne({ checkoutRequestId: CheckoutRequestID });
  if (!stkRequest) {
    console.error(`STK request not found for CheckoutRequestID: ${CheckoutRequestID}`);
    return;
  }

  const transAmount = metadata.Amount;
  const msisdn = metadata.PhoneNumber.toString();
  const user = await MikrotikUser.findOne({ mPesaRefNo: stkRequest.accountReference, tenantOwner: stkRequest.tenantOwner });

  if (!user) {
    const alertMessage = `STK payment of KES ${transAmount} received for account '${stkRequest.accountReference}', but no user was found.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: stkRequest.accountReference, tenantOwner: stkRequest.tenantOwner });
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
    tenantOwner: user.tenantOwner,
  });

  await StkRequest.deleteOne({ _id: stkRequest._id });
};

const processC2bCallback = async (callbackData) => {
  const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, MiddleName, LastName, OrgAccountBalance, BusinessShortCode } = callbackData;

  if (!TransID) {
    console.log('C2B validation request or invalid callback. Ignoring.');
    return;
  }

  // Find the tenant by the paybill number (BusinessShortCode)
  const settings = await ApplicationSettings.findOne({ 'mpesaPaybill.paybillNumber': BusinessShortCode });

  if (!settings) {
    const alertMessage = `C2B payment of KES ${TransAmount} received for paybill '${BusinessShortCode}', but no tenant is configured with this paybill.`;
    // Since we don't know the tenant, we can't assign a tenantOwner to this alert.
    // It will be a system-level alert.
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber });
    console.error(alertMessage);
    return;
  }

  const tenantOwner = settings.tenantOwner;

  // Find the user within the correct tenant
  const user = await MikrotikUser.findOne({ mPesaRefNo: BillRefNumber, tenantOwner: tenantOwner });

  if (!user) {
    const alertMessage = `C2B payment of KES ${TransAmount} for account '${BillRefNumber}' received, but no user was found in tenant ${tenantOwner}.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, tenantOwner: tenantOwner });
    console.error(alertMessage);
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
    tenantOwner: user.tenantOwner,
  });
};

module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  registerCallbackURL,
};