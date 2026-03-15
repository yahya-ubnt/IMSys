const axios = require('axios');
const moment = require('moment');
const mongoose = require('mongoose');
const ApplicationSettings = require('../models/ApplicationSettings');
const StkRequest = require('../models/StkRequest');
const Transaction = require('../models/Transaction');
const HotspotPlan = require('../models/HotspotPlan');
const HotspotSession = require('../models/HotspotSession');
const HotspotTransaction = require('../models/HotspotTransaction');
const MikrotikRouter = require('../models/MikrotikRouter');
const MpesaAlert = require('../models/MpesaAlert');
const MikrotikUser = require('../models/MikrotikUser');
const PaymentService = require('./paymentService');
const { addHotspotIpBinding } = require('../utils/mikrotikUtils');
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { DARAJA_CALLBACK_URL } = require('../config/env');
const { formatPhoneNumber } = require('../utils/formatters');

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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find user by _id or mPesaRefNo
      let userToCredit;
      if (mongoose.Types.ObjectId.isValid(stkRequest.accountReference)) {
        userToCredit = await MikrotikUser.findById(stkRequest.accountReference).session(session);
      } else {
        userToCredit = await MikrotikUser.findOne({ mPesaRefNo: stkRequest.accountReference, tenant: stkRequest.tenant }).session(session);
      }

      if (!userToCredit) {
        throw new Error(`User not found for reference: ${stkRequest.accountReference}`);
      }

      await processSubscriptionPayment(
        userToCredit._id,
        amount,
        'M-Pesa (STK)',
        transactionId,
        null, // adminId
        session
      );

      await Transaction.create([{
        transactionId,
        amount,
        referenceNumber: stkRequest.accountReference,
        officialName: userToCredit.officialName,
        msisdn,
        transactionDate: new Date(),
        paymentMethod: 'M-Pesa (STK)',
        tenant: stkRequest.tenant,
        mikrotikUser: userToCredit._id,
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error(`[MpesaService] STK processing failed for TX ${transactionId}:`, error.message);
      // Optionally create an alert
      await MpesaAlert.create({ message: error.message, transactionId, amount, referenceNumber: stkRequest.accountReference, tenant: stkRequest.tenant, paymentDate: new Date() });
      throw error; // Re-throw to be handled by caller if necessary
    } finally {
      session.endSession();
    }
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

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userToCredit = await MikrotikUser.findOne({ mPesaRefNo: BillRefNumber, tenant: settings.tenant }).session(session);

    if (!userToCredit) {
      const alertMessage = `C2B payment received, but user with M-Pesa Ref '${BillRefNumber}' not found in tenant '${settings.tenant}'.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, tenant: settings.tenant, paymentDate: new Date() });
      // We still commit because the alert creation should persist. The actual payment hasn't been processed.
      await session.commitTransaction(); 
      return;
    }

    await processSubscriptionPayment(
      userToCredit._id,
      TransAmount,
      'M-Pesa (C2B)',
      TransID,
      null, // adminId
      session
    );

    await Transaction.create([{
      transactionId: TransID,
      amount: TransAmount,
      referenceNumber: BillRefNumber,
      officialName: userToCredit.officialName,
      msisdn: MSISDN,
      transactionDate: new Date(),
      paymentMethod: 'M-Pesa (C2B)',
      tenant: settings.tenant,
      mikrotikUser: userToCredit._id,
    }], { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error(`[MpesaService] C2B processing failed for TX ${TransID}:`, error.message);
    await MpesaAlert.create({ message: error.message, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, tenant: settings.tenant, paymentDate: new Date() });
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  registerCallbackURL,
};
