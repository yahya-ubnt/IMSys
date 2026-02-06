const axios = require('axios');
const moment = require('moment');
const mongoose = require('mongoose');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const ApplicationSettings = require('../models/ApplicationSettings');
const StkRequest = require('../models/StkRequest');
const HotspotPlan = require('../models/HotspotPlan');
const HotspotSession = require('../models/HotspotSession');
const HotspotTransaction = require('../models/HotspotTransaction');
const MikrotikRouter = require('../models/MikrotikRouter');
const Invoice = require('../models/Invoice');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { addHotspotIpBinding } = require('../utils/mikrotikUtils');
const { DARAJA_CALLBACK_URL } = require('../config/env');
const { formatPhoneNumber } = require('../utils/formatters');

// ... (getTenantMpesaCredentials, getDarajaAxiosInstance, initiateStkPushService, registerCallbackURL remain the same)

const getTenantMpesaCredentials = async (tenant) => {
  const settings = await ApplicationSettings.findOne({ tenant });
  if (!settings || !settings.mpesaPaybill || !settings.mpesaPaybill.consumerKey) {
    throw new Error(`M-Pesa settings not configured for tenant ${tenant}`);
  }
  return settings.mpesaPaybill;
};

const getDarajaAxiosInstance = async (tenant) => {
  const credentials = await getTenantMpesaCredentials(tenant);
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

const initiateStkPushService = async (tenant, amount, phoneNumber, accountReference, type = 'SUBSCRIPTION', planId = null) => {
  const credentials = await getTenantMpesaCredentials(tenant);
  const darajaAxios = await getDarajaAxiosInstance(tenant);
  
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(`${credentials.paybillNumber}${credentials.passkey}${timestamp}`).toString('base64');
  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

  let callbackUrl = credentials.callbackURL || DARAJA_CALLBACK_URL;

  const stkPushPayload = {
    BusinessShortCode: credentials.paybillNumber,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: formattedPhoneNumber,
    PartyB: credentials.paybillNumber,
    PhoneNumber: formattedPhoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: type === 'HOTSPOT' ? 'Hotspot Payment' : 'Subscription Payment'
  };

  const response = await darajaAxios.post('/mpesa/stkpush/v1/processrequest', stkPushPayload);

  await StkRequest.create({
    tenant,
    checkoutRequestId: response.data.CheckoutRequestID,
    accountReference,
    type,
    planId,
  });

  return response.data;
};

const registerCallbackURL = async (tenant) => {
  const credentials = await getTenantMpesaCredentials(tenant);
  const darajaAxios = await getDarajaAxiosInstance(tenant);

  const callbackUrl = credentials.callbackURL || DARAJA_CALLBACK_URL;

  const response = await darajaAxios.post('/mpesa/c2b/v1/registerurl', {
    ShortCode: credentials.paybillNumber,
    ResponseType: 'Completed',
    ConfirmationURL: callbackUrl,
    ValidationURL: callbackUrl
  });

  return response.data;
};


/**
 * A centralized function to handle a successful payment, ensuring atomicity.
 */
const handleSuccessfulPayment = async (params) => {
  const { tenant, amount, transactionId, reference, paymentMethod, msisdn, officialName, comment } = params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let userToCredit;
    let finalComment = comment;

    // --- INVOICE PAYMENT LOGIC ---
    if (reference.startsWith('INV-')) {
      const invoice = await Invoice.findOne({ 
        invoiceNumber: reference, 
        status: { $in: ['Unpaid', 'Overdue'] }, 
        tenant: tenant 
      }).session(session).populate('mikrotikUser');

      if (!invoice) {
        throw new Error(`Payment received for invoice '${reference}', but the invoice was not found, already paid, or does not belong to this tenant.`);
      }
      
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
      await invoice.save({ session });
      
      userToCredit = invoice.mikrotikUser;
      finalComment = `Payment for Invoice #${reference}`;
    } 
    // --- SUBSCRIPTION PAYMENT LOGIC ---
    else {
      userToCredit = await MikrotikUser.findOne({ mPesaRefNo: reference, tenant: tenant }).session(session);
    }

    // If no user is found for either invoice or subscription, create an alert.
    if (!userToCredit) {
      throw new Error(`Payment of KES ${amount} for account '${reference}' received, but no user was found.`);
    }

    // Process the payment against the user's account.
    await processSubscriptionPayment(userToCredit._id, amount, paymentMethod, transactionId, null, session);

    // Create a standard transaction log.
    await Transaction.create([{
      transactionId,
      amount,
      referenceNumber: reference,
      officialName: officialName || userToCredit.officialName,
      msisdn,
      transactionDate: new Date(),
      paymentMethod,
      tenant,
      mikrotikUser: userToCredit._id,
      comment: finalComment,
    }], { session });

    await session.commitTransaction();
    console.log(`Successfully processed payment for ${reference} with TX ID ${transactionId}`);

  } catch (error) {
    await session.abortTransaction();
    console.error(`Payment processing failed for TX ID ${transactionId}:`, error.message);
    // Create an alert for reconciliation.
    await MpesaAlert.create({ 
      message: error.message, 
      transactionId, 
      amount, 
      referenceNumber: reference, 
      tenant, 
      paymentDate: new Date() 
    });
  } finally {
    session.endSession();
  }
};


const processStkCallback = async (callbackData) => {
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

  if (ResultCode !== 0) {
    console.error(`STK Push failed for ${CheckoutRequestID}: ${ResultDesc}`);
    await StkRequest.deleteOne({ checkoutRequestId: CheckoutRequestID });
    return;
  }

  const metadata = CallbackMetadata.Item.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});

  const transactionId = metadata.MpesaReceiptNumber;
  const amount = metadata.Amount;
  const msisdn = metadata.PhoneNumber.toString();

  const stkRequest = await StkRequest.findOne({ checkoutRequestId: CheckoutRequestID });
  if (!stkRequest) {
    console.error(`STK request not found for CheckoutRequestID: ${CheckoutRequestID}`);
    return;
  }

  const existingTransaction = await Transaction.findOne({ transactionId });
  if (existingTransaction) {
    console.log(`Transaction ${transactionId} already processed.`);
    await StkRequest.deleteOne({ _id: stkRequest._id });
    return;
  }

  // --- HOTSPOT LOGIC (Remains separate as it doesn't use processSubscriptionPayment) ---
  if (stkRequest.type === 'HOTSPOT') {
    // This logic needs its own transaction if it involves multiple DB writes.
    // For now, it is left as is, but should be reviewed for atomicity.
    const hotspotTransaction = await HotspotTransaction.findOneAndUpdate(
      { macAddress: stkRequest.accountReference, status: 'pending' },
      { status: 'completed', transactionId: transactionId },
      { new: true }
    );

    if (hotspotTransaction) {
      const plan = await HotspotPlan.findById(stkRequest.planId);
      const router = await MikrotikRouter.findById(plan.mikrotikRouter);
      const now = new Date();
      const endTime = new Date(now.getTime() + (plan.timeLimitValue * (plan.timeLimitUnit === 'minutes' ? 60 : (plan.timeLimitUnit === 'hours' ? 3600 : 86400)) * 1000));

      await HotspotSession.findOneAndUpdate(
        { macAddress: stkRequest.accountReference },
        { planId: stkRequest.planId, startTime: now, endTime: endTime, dataUsage: 0 },
        { upsert: true, new: true }
      );
      await addHotspotIpBinding(router, stkRequest.accountReference, plan.server);
    }
  } 
  // --- INVOICE & SUBSCRIPTION LOGIC ---
  else {
    await handleSuccessfulPayment({
      tenant: stkRequest.tenant,
      amount: amount,
      transactionId: transactionId,
      reference: stkRequest.accountReference,
      paymentMethod: 'M-Pesa (STK)',
      msisdn: msisdn,
      officialName: null, // Will be fetched from the user/invoice record
      comment: null,
    });
  }

  await StkRequest.deleteOne({ _id: stkRequest._id });
};

const processC2bCallback = async (callbackData) => {
  const { TransID, TransAmount, BillRefNumber, MSISDN, FirstName, MiddleName, LastName, BusinessShortCode } = callbackData;

  if (!TransID) {
    console.log('C2B validation request or invalid callback. Ignoring.');
    return;
  }

  const settings = await ApplicationSettings.findOne({ 'mpesaPaybill.paybillNumber': BusinessShortCode });
  if (!settings) {
    const alertMessage = `C2B payment of KES ${TransAmount} received for paybill '${BusinessShortCode}', but no tenant is configured.`;
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, paymentDate: new Date() });
    return;
  }

  const existingTransaction = await Transaction.findOne({ transactionId: TransID });
  if (existingTransaction) {
    console.log(`Transaction ${TransID} already processed.`);
    return;
  }

  await handleSuccessfulPayment({
    tenant: settings.tenant,
    amount: TransAmount,
    transactionId: TransID,
    reference: BillRefNumber,
    paymentMethod: 'M-Pesa (C2B)',
    msisdn: MSISDN,
    officialName: `${FirstName} ${LastName}`.trim(),
    comment: null,
  });
};

module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  registerCallbackURL,
};