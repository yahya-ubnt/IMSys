const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const HotspotTransaction = require('../models/HotspotTransaction');
const HotspotSession = require('../models/HotspotSession');
const HotspotPlan = require('../models/HotspotPlan');
const MikrotikRouter = require('../models/MikrotikRouter');
const { initiateStkPushService } = require('../services/mpesaService');
const { addHotspotIpBinding } = require('../utils/mikrotikUtils');

const initiateStkPush = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { planId, phoneNumber, macAddress } = req.body;

  const plan = await HotspotPlan.findById(planId).populate('mikrotikRouter');
  if (!plan) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  const hotspotTransaction = await HotspotTransaction.create({
    planId,
    phoneNumber,
    macAddress,
    amount: plan.price,
    tenantOwner: plan.tenant,
  });

  try {
    const response = await initiateStkPushService(
      plan.tenant,
      plan.price,
      phoneNumber,
      macAddress, // Using macAddress as the account reference
      'HOTSPOT',
      planId
    );
    res.status(200).json(response);
  } catch (error) {
    console.error('Error initiating STK push:', error);
    hotspotTransaction.status = 'failed';
    await hotspotTransaction.save();
    res.status(500).json({ message: 'Failed to initiate STK push.' });
  }
});

const handleHotspotCallback = asyncHandler(async (req, res) => {
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = req.body.Body.stkCallback;

  if (ResultCode !== 0) {
    console.error(`STK Push failed for ${CheckoutRequestID}: ${ResultDesc}`);
    // Find the transaction and mark it as failed
    const transaction = await HotspotTransaction.findOne({ checkoutRequestId: CheckoutRequestID });
    if (transaction) {
      transaction.status = 'failed';
      await transaction.save();
    }
    return;
  }

  const metadata = CallbackMetadata.Item.reduce((acc, item) => {
    acc[item.Name] = item.Value;
    return acc;
  }, {});

  const transId = metadata.MpesaReceiptNumber;
  const existingTransaction = await HotspotTransaction.findOne({ transactionId: transId });
  if (existingTransaction) {
    console.log(`Transaction ${transId} already processed.`);
    return;
  }

  const transaction = await HotspotTransaction.findOne({ checkoutRequestId: CheckoutRequestID });
  if (!transaction) {
    console.error(`Hotspot transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
    return;
  }

  transaction.status = 'completed';
  transaction.transactionId = transId;
  await transaction.save();

  const plan = await HotspotPlan.findById(transaction.planId);
  const router = await MikrotikRouter.findById(plan.mikrotikRouter);

  let endTime;
  const now = new Date();
  switch (plan.timeLimitUnit) {
    case 'minutes':
      endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 1000);
      break;
    case 'hours':
      endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000);
      break;
    case 'days':
      endTime = new Date(now.getTime() + plan.timeLimitValue * 24 * 60 * 60 * 1000);
      break;
    default:
      endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000); // Default to hours
  }

  const session = await HotspotSession.findOneAndUpdate(
    { macAddress: transaction.macAddress },
    {
      planId: transaction.planId,
      startTime: now,
      endTime: endTime,
      dataUsage: 0,
    },
    { upsert: true, new: true }
  );

  await addHotspotIpBinding(router, transaction.macAddress, plan.server);

  res.status(200).json({ message: 'Callback processed successfully' });
});

module.exports = {
  initiateStkPush,
  handleHotspotCallback,
};
