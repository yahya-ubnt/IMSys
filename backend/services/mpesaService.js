const axios = require('axios');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const MpesaAlert = require('../models/MpesaAlert');
const Transaction = require('../models/Transaction');
const ApplicationSettings = require('../models/ApplicationSettings');
const StkRequest = require('../models/StkRequest');
const HotspotPlan = require('../models/HotspotPlan');
const HotspotSession = require('../models/HotspotSession');
const HotspotTransaction = require('../models/HotspotTransaction');
const MikrotikRouter = require('../models/MikrotikRouter');
const Invoice = require('../models/Invoice'); // Import Invoice model
const { processSubscriptionPayment } = require('../utils/paymentProcessing');
const { addHotspotIpBinding } = require('../utils/mikrotikUtils');
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
  // The callback URL is now the same for all types, the logic is handled in processStkCallback

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

  const transId = metadata.MpesaReceiptNumber;
  const transAmount = metadata.Amount;
  const msisdn = metadata.PhoneNumber.toString();

  const stkRequest = await StkRequest.findOne({ checkoutRequestId: CheckoutRequestID });

  if (!stkRequest) {
    console.error(`STK request not found for CheckoutRequestID: ${CheckoutRequestID}`);
    return;
  }

  const existingTransaction = await Transaction.findOne({ transactionId: transId });
  if (existingTransaction) {
    console.log(`Transaction ${transId} already processed.`);
    await StkRequest.deleteOne({ _id: stkRequest._id });
    return;
  }

  // --- INVOICE PAYMENT VIA STK PUSH ---
  if (stkRequest.accountReference.startsWith('INV-')) {
    const invoice = await Invoice.findOne({ 
      invoiceNumber: stkRequest.accountReference, 
      status: { $in: ['Unpaid', 'Overdue'] }, 
      tenant: stkRequest.tenant 
    }).populate('mikrotikUser');

    if (!invoice) {
      const alertMessage = `STK payment of KES ${transAmount} received for invoice '${stkRequest.accountReference}', but the invoice was not found or already paid.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: stkRequest.accountReference, tenant: stkRequest.tenant, paymentDate: new Date() });
      console.error(alertMessage);
    } else {
      invoice.status = 'Paid';
      invoice.paidDate = new Date();
      await invoice.save();

      await processSubscriptionPayment(invoice.mikrotikUser._id, transAmount, 'M-Pesa (STK Invoice)', transId);

      await Transaction.create({
        transactionId: transId,
        amount: transAmount,
        referenceNumber: stkRequest.accountReference,
        officialName: invoice.mikrotikUser.officialName, // Use name from DB
        msisdn: msisdn,
        transactionDate: new Date(),
        paymentMethod: 'M-Pesa (STK)',
        tenant: stkRequest.tenant,
        mikrotikUser: invoice.mikrotikUser._id,
        comment: `Payment for Invoice #${stkRequest.accountReference}`
      });
    }
  }
  // --- HOTSPOT LOGIC ---
  else if (stkRequest.type === 'HOTSPOT') {
    const hotspotTransaction = await HotspotTransaction.findOneAndUpdate(
      { macAddress: stkRequest.accountReference, status: 'pending' },
      { status: 'completed', transactionId: transId },
      { new: true }
    );

    if (!hotspotTransaction) {
      console.error(`Hotspot transaction not found for MAC address: ${stkRequest.accountReference}`);
    } else {
      const plan = await HotspotPlan.findById(stkRequest.planId);
      const router = await MikrotikRouter.findById(plan.mikrotikRouter);

      let endTime;
      const now = new Date();
      switch (plan.timeLimitUnit) {
        case 'minutes': endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 1000); break;
        case 'hours': endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000); break;
        case 'days': endTime = new Date(now.getTime() + plan.timeLimitValue * 24 * 60 * 60 * 1000); break;
        default: endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000);
      }

      await HotspotSession.findOneAndUpdate(
        { macAddress: stkRequest.accountReference },
        { planId: stkRequest.planId, startTime: now, endTime: endTime, dataUsage: 0 },
        { upsert: true, new: true }
      );

      await addHotspotIpBinding(router, stkRequest.accountReference, plan.server);
    }
  } 
  // --- SUBSCRIPTION LOGIC ---
  else {
    const user = await MikrotikUser.findOne({ mPesaRefNo: stkRequest.accountReference, tenant: stkRequest.tenant });

    if (!user) {
      const alertMessage = `STK payment of KES ${transAmount} received for account '${stkRequest.accountReference}', but no user was found.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: transId, amount: transAmount, referenceNumber: stkRequest.accountReference, tenant: stkRequest.tenant, paymentDate: new Date() });
    } else {
      await processSubscriptionPayment(user._id, transAmount, 'M-Pesa (STK)', transId);

      await Transaction.create({
        transactionId: transId,
        amount: transAmount,
        referenceNumber: stkRequest.accountReference, // Corrected from user.username
        officialName: user.officialName, // Use name from DB
        msisdn: msisdn,
        transactionDate: new Date(),
        paymentMethod: 'M-Pesa (STK)',
        tenant: user.tenant,
        mikrotikUser: user._id,
      });
    }
  }

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
    await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, paymentDate: new Date() });
    console.error(alertMessage);
    return;
  }

  const tenant = settings.tenant;

  // --- INVOICE PAYMENT LOGIC ---
  if (BillRefNumber.startsWith('INV-')) {
    const invoice = await Invoice.findOne({ 
      invoiceNumber: BillRefNumber, 
      status: { $in: ['Unpaid', 'Overdue'] }, 
      tenant: tenant 
    }).populate('mikrotikUser');

    if (!invoice) {
      const alertMessage = `Payment of KES ${TransAmount} received for invoice '${BillRefNumber}', but the invoice was not found, is already paid, or does not belong to this tenant.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, tenant: tenant, paymentDate: new Date() });
      console.error(alertMessage);
      return;
    }
    
    // Mark invoice as paid
    invoice.status = 'Paid';
    invoice.paidDate = new Date();
    await invoice.save();

    // Process the payment against the user's wallet to clear the debt
    await processSubscriptionPayment(invoice.mikrotikUser._id, TransAmount, 'M-Pesa (Invoice)', TransID);

    // Create a standard transaction log
    await Transaction.create({
      transactionId: TransID,
      amount: TransAmount,
      referenceNumber: BillRefNumber,
      officialName: `${FirstName} ${LastName}`.trim(),
      msisdn: MSISDN,
      balance: OrgAccountBalance,
      transactionDate: new Date(),
      paymentMethod: 'M-Pesa',
      tenant: tenant,
      mikrotikUser: invoice.mikrotikUser._id,
      comment: `Payment for Invoice #${BillRefNumber}`
    });

  } 
  // --- SUBSCRIPTION PAYMENT LOGIC (Existing) ---
  else {
    const user = await MikrotikUser.findOne({ mPesaRefNo: BillRefNumber, tenant: tenant });

    if (!user) {
      const alertMessage = `C2B payment of KES ${TransAmount} for account '${BillRefNumber}' received, but no user was found in tenant ${tenant}.`;
      await MpesaAlert.create({ message: alertMessage, transactionId: TransID, amount: TransAmount, referenceNumber: BillRefNumber, tenant: tenant, paymentDate: new Date() });
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
      tenant: user.tenant,
      mikrotikUser: user._id,
    });
  }
};

module.exports = {
  initiateStkPushService,
  processStkCallback,
  processC2bCallback,
  registerCallbackURL,
};