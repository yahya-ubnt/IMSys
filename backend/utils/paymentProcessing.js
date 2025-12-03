const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const { reconnectMikrotikUser } = require('./mikrotikUtils');
const { sendAcknowledgementSms } = require('../services/smsService');
const smsTriggers = require('../constants/smsTriggers');

/**
 * Processes a subscription payment with a priority-based logic.
 * 1. Credits the full amount to the user's wallet.
 * 2. Pays for one month of service if the subscription is expired.
 * 3. Pays off any outstanding debt.
 * 4. Buys future months of service with any remainder.
 * @param {string} mikrotikUserId - The ID of the Mikrotik user.
 * @param {number} amountPaid - The total amount paid by the user.
 * @param {string} paymentSource - The source of the payment (e.g., 'Cash', 'M-Pesa').
 * @param {string} externalTransactionId - The transaction ID from the payment provider.
 * @param {string} adminId - The ID of the admin processing the payment (if applicable).
 */
const processSubscriptionPayment = async (mikrotikUserId, amountPaid, paymentSource, externalTransactionId, adminId = null) => {
  console.log(`[${new Date().toISOString()}] Starting payment processing for user ${mikrotikUserId} with amount ${amountPaid}`);
  const user = await MikrotikUser.findById(mikrotikUserId).populate('package');

  if (!user) {
    console.error(`[${new Date().toISOString()}] User not found for payment processing: ${mikrotikUserId}`);
    throw new Error(`User not found for payment processing: ${mikrotikUserId}`);
  }
  console.log(`[${new Date().toISOString()}] User found: ${user.username}, current wallet balance: ${user.walletBalance}, expiry: ${user.expiryDate}`);

  // 1. Credit the full amount to the user's wallet
  user.walletBalance += amountPaid;
  console.log(`[${new Date().toISOString()}] Wallet credited. New balance: ${user.walletBalance}`);

  await WalletTransaction.create({
    tenant: user.tenant,
    mikrotikUser: user._id,
    transactionId: `WT-CREDIT-${Date.now()}`,
    type: 'Credit',
    amount: amountPaid,
    source: paymentSource,
    balanceAfter: user.walletBalance,
    comment: `Payment received. Original TX ID: ${externalTransactionId}`,
    processedBy: adminId,
  });
  console.log(`[${new Date().toISOString()}] Wallet transaction (credit) created.`);

  if (!user.package || !user.package.price || user.package.price <= 0) {
    console.warn(`[${new Date().toISOString()}] User ${user.username} has no valid package price. Amount credited to wallet.`);
    await user.save();
    return;
  }
  console.log(`[${new Date().toISOString()}] Package price: ${user.package.price}`);

  const packagePrice = user.package.price;
  let monthsExtended = 0;
  const now = moment();
  console.log(`[${new Date().toISOString()}] Current time: ${now.toISOString()}`);

  // 2. Pay for one month of service if the subscription is expired and wallet has sufficient funds
  let newExpiryDate = moment(user.expiryDate || now);
  console.log(`[${new Date().toISOString()}] Initial expiry date: ${newExpiryDate.toISOString()}`);

  if (newExpiryDate.isBefore(now) && user.walletBalance >= packagePrice) {
    console.log(`[${new Date().toISOString()}] User expired and has sufficient funds. Extending by 1 month.`);
    user.walletBalance -= packagePrice;
    newExpiryDate = now.add(1, 'months');
    user.expiryDate = newExpiryDate.toDate();
    monthsExtended += 1;

    await WalletTransaction.create({
      tenant: user.tenant,
      mikrotikUser: user._id,
      transactionId: `DEBIT-RENEW-${Date.now()}`,
      type: 'Debit',
      amount: packagePrice,
      source: 'Subscription Renewal',
      balanceAfter: user.walletBalance,
      comment: 'Automatic renewal of 1 month.',
      processedBy: null, // System-processed
    });
    console.log(`[${new Date().toISOString()}] Wallet transaction (debit for renewal) created. New expiry: ${user.expiryDate}`);
  } else {
    console.log(`[${new Date().toISOString()}] User not expired or insufficient funds for 1 month renewal. Expiry: ${newExpiryDate.toISOString()}, Wallet: ${user.walletBalance}, Package Price: ${packagePrice}`);
  }

  // 3. Pay off any outstanding debt (already handled by crediting the wallet)

  // 4. Buy future months of service with any remainder
  if (user.walletBalance >= packagePrice) {
    const futureMonthsToBuy = Math.floor(user.walletBalance / packagePrice);
    const costOfFutureMonths = futureMonthsToBuy * packagePrice;
    console.log(`[${new Date().toISOString()}] Funds available for ${futureMonthsToBuy} future month(s). Cost: ${costOfFutureMonths}`);

    if (futureMonthsToBuy > 0) {
      let currentExpiry = moment(user.expiryDate);
      user.expiryDate = currentExpiry.add(futureMonthsToBuy, 'months').toDate();
      monthsExtended += futureMonthsToBuy;

      user.walletBalance -= costOfFutureMonths;

      await WalletTransaction.create({
        tenant: user.tenant,
        mikrotikUser: user._id,
        transactionId: `DEBIT-FUTURE-${Date.now()}`,
        type: 'Debit',
        amount: costOfFutureMonths,
        source: 'Subscription Purchase',
        balanceAfter: user.walletBalance,
        comment: `Automatic purchase of ${futureMonthsToBuy} future month(s).`,
        processedBy: null, // System-processed
      });
      console.log(`[${new Date().toISOString()}] Wallet transaction (debit for future months) created. New expiry: ${user.expiryDate}`);
    }
  } else {
    console.log(`[${new Date().toISOString()}] Insufficient funds for future month purchases. Wallet: ${user.walletBalance}, Package Price: ${packagePrice}`);
  }

  await user.save();
  console.log(`[${new Date().toISOString()}] User saved to database. Final expiry: ${user.expiryDate}, final balance: ${user.walletBalance}`);

  if (monthsExtended > 0) {
    console.log(`[${new Date().toISOString()}] Reconnecting Mikrotik user ${user.username}.`);
    await reconnectMikrotikUser(user._id, user.tenant);
  }

  try {
    console.log(`[${new Date().toISOString()}] Attempting to send payment acknowledgement SMS.`);
    await sendAcknowledgementSms(
      smsTriggers.PAYMENT_RECEIVED,
      user.mobileNumber,
      {
        officialName: user.officialName,
        amountPaid: amountPaid,
        walletBalance: user.walletBalance.toFixed(2),
        userId: user.user,
        tenant: user.tenant, // Pass the tenant
        mikrotikUser: user._id, // Associate with the user
      }
    );
    console.log(`[${new Date().toISOString()}] Payment acknowledgement SMS sent successfully.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to send payment acknowledgement SMS for user ${user.username}:`, error);
  }

  console.log(`[${new Date().toISOString()}] Payment processing complete for ${user.username}. Service extended by ${monthsExtended} month(s). New balance: ${user.walletBalance.toFixed(2)}`);
};

module.exports = { processSubscriptionPayment };