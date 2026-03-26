const MikrotikUser = require('../models/MikrotikUser');
const moment = require('moment');
const { randomUUID } = require('crypto');
const WalletTransaction = require('../models/WalletTransaction');
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
 * @param {object} session - The Mongoose session for atomic operations.
 */
const processSubscriptionPayment = async (mikrotikUserId, amountPaid, paymentSource, externalTransactionId, adminId = null, session) => {
  console.log(`[${new Date().toISOString()}] Starting payment processing for user ${mikrotikUserId} with amount ${amountPaid}`);
  
  // Atomically credit the user's wallet and get the updated user document
  const user = await MikrotikUser.findByIdAndUpdate(
    mikrotikUserId,
    { $inc: { walletBalance: amountPaid } },
    { new: true, session }
  ).populate('package');

  if (!user) {
    console.error(`[${new Date().toISOString()}] User not found for payment processing: ${mikrotikUserId}`);
    throw new Error(`User not found for payment processing: ${mikrotikUserId}`);
  }
    console.log(`[${new Date().toISOString()}] User found: ${user.username}, new wallet balance after credit: ${user.walletBalance}, expiry: ${user.expiryDate}`);
  
    // Create a wallet transaction record for the initial credit
    await WalletTransaction.create([{
      tenant: user.tenant,
      mikrotikUser: user._id,
      transactionId: `WT-CREDIT-${randomUUID()}`,
      type: 'Credit',
      amount: amountPaid,
      source: paymentSource,
      balanceAfter: user.walletBalance,
      comment: `Payment received. Original TX ID: ${externalTransactionId}`,
      processedBy: adminId,
    }], { session });
    console.log(`[${new Date().toISOString()}] Wallet transaction (credit) created.`);
  
    if (!user.package || !user.package.price || user.package.price <= 0) {
      console.warn(`[${new Date().toISOString()}] User ${user.username} has no valid package price. Amount credited to wallet.`);
      // No need to save here, as the final save will handle it.
      return;
    }
    console.log(`[${new Date().toISOString()}] Package price: ${user.package.price}`);
  
    const packagePrice = user.customPackagePrice !== undefined && user.customPackagePrice !== null
      ? user.customPackagePrice
      : user.package.price;
    let daysExtended = 0;
    const now = moment();
    let currentExpiryMoment = moment(user.expiryDate); // Use a separate moment object for current expiry
    let gracePeriodApplied = false; // Flag to track if grace period logic was applied

    // --- Grace Period Logic ---
    if (user.gracePeriodEnabled) {
        gracePeriodApplied = true;
        const paymentMoment = moment(); // Current time of payment
        const expectedPaymentMoment = moment(user.expectedPaymentDate);
        const originalExpiryMoment = moment(user.originalExpiryDate);

        if (paymentMoment.isSameOrBefore(expectedPaymentMoment, 'day')) {
            // Scenario A: Payment Made During the Grace Period
            // New expiry date starts from originalExpiryDate
            currentExpiryMoment = originalExpiryMoment;
            console.log(`[Payment] User ${user.username} paid during grace period. New base expiry: ${currentExpiryMoment.toISOString()}`);
        } else {
            // Scenario B: Payment Made After the Grace Period (Late Payment)
            // New expiry date starts from now, then subtract grace days
            const graceDaysUsed = expectedPaymentMoment.diff(originalExpiryMoment, 'days');
            user.gracePeriodDaysUsed = graceDaysUsed; // Store for later use
            console.log(`[Payment] User ${user.username} paid after grace period. Grace days used: ${graceDaysUsed}.`);
            // The existing logic of `currentExpiryMoment = now` will apply below
            // and we'll adjust the final expiry after adding package duration.
        }

        // Reset grace period flags
        user.gracePeriodEnabled = false;
        user.expectedPaymentDate = undefined;
        user.originalExpiryDate = undefined;
        user.status = 'active'; // Ensure user is active after payment
        user.syncStatus = 'pending'; // Trigger sync to re-enable on Mikrotik
    } else {
        // Existing logic for non-grace period users
        if (currentExpiryMoment.isSameOrBefore(now)) {
            currentExpiryMoment = now;
        }
    }
    // --- End Grace Period Logic ---

    console.log(`[${new Date().toISOString()}] Base expiry date for calculation: ${currentExpiryMoment.toISOString()}`);
  
    // Priority 1: Pay off outstanding installation fee if not already paid
    if (!user.installationFeePaid && user.installationFee > 0 && user.walletBalance >= user.installationFee) {
      const fee = user.installationFee;
      console.log(`[${new Date().toISOString()}] Paying installation fee of ${fee}.`);
      user.walletBalance -= fee;
      user.installationFee = 0; // Clear the fee amount
      user.installationFeePaid = true; // Mark as paid
  
      await WalletTransaction.create([{
        tenant: user.tenant,
        mikrotikUser: user._id,
        transactionId: `DEBIT-INSTALL-${randomUUID()}`,
        type: 'Debit',
        amount: fee,
        source: 'Installation Fee',
        balanceAfter: user.walletBalance,
        comment: 'Payment for one-time installation fee.',
      }], { session });
      console.log(`[${new Date().toISOString()}] Wallet transaction (installation fee debit) created.`);
    }

    // Priority 2: Pay for one package duration if user has funds and is expired or has no expiry set
    if (user.walletBalance >= packagePrice && (user.expiryDate === null || moment(user.expiryDate).isSameOrBefore(now))) {
      console.log(`[${new Date().toISOString()}] User expired or no expiry set. Renewing for ${user.package.durationInDays} days.`);
      user.walletBalance -= packagePrice;
      currentExpiryMoment.add(user.package.durationInDays, 'days'); // Add to currentExpiryMoment
      user.expiryDate = currentExpiryMoment.toDate();
      daysExtended += user.package.durationInDays;
  
      await WalletTransaction.create([{
        tenant: user.tenant,
        mikrotikUser: user._id,
        transactionId: `DEBIT-RENEW-${randomUUID()}`,
        type: 'Debit',
        amount: packagePrice,
        source: 'Subscription Renewal',
        balanceAfter: user.walletBalance,
        comment: `Automatic renewal of ${user.package.durationInDays} days.`,
      }], { session });
      console.log(`[${new Date().toISOString()}] Wallet transaction (renewal debit) created. New expiry: ${user.expiryDate}`);
    }
  
    // Priority 3: Buy future package durations with remaining balance
    if (user.walletBalance >= packagePrice) {
      const futureDurationsToBuy = Math.floor(user.walletBalance / packagePrice);
      if (futureDurationsToBuy > 0) {
        const costOfFutureDurations = futureDurationsToBuy * packagePrice;
        const totalDaysToAdd = futureDurationsToBuy * user.package.durationInDays;
        console.log(`[${new Date().toISOString()}] Purchasing ${futureDurationsToBuy} future package durations (${totalDaysToAdd} days).`);
        
        currentExpiryMoment.add(totalDaysToAdd, 'days');
        user.expiryDate = currentExpiryMoment.toDate();
        daysExtended += totalDaysToAdd;
        user.walletBalance -= costOfFutureDurations;
  
        await WalletTransaction.create([{
          tenant: user.tenant,
          mikrotikUser: user._id,
          transactionId: `DEBIT-FUTURE-${randomUUID()}`,
          type: 'Debit',
          amount: costOfFutureDurations,
        source: 'Subscription Purchase',
        balanceAfter: user.walletBalance,
        comment: `Automatic purchase of ${futureDurationsToBuy} future package durations (${totalDaysToAdd} days).`,
        }], { session });
        console.log(`[${new Date().toISOString()}] Wallet transaction (future purchase debit) created. New expiry: ${user.expiryDate}`);
      }
    }

    // Adjust expiry date if payment was made after grace period
    if (gracePeriodApplied && user.gracePeriodDaysUsed > 0) {
        currentExpiryMoment.subtract(user.gracePeriodDaysUsed, 'days');
        user.expiryDate = currentExpiryMoment.toDate();
        console.log(`[Payment] Adjusted expiry for ${user.username} by subtracting ${user.gracePeriodDaysUsed} grace days.`);
        user.gracePeriodDaysUsed = 0; // Reset after use
    }

  await user.save({ session });
  user.markModified('expiryDate');

  if (daysExtended > 0 || gracePeriodApplied) { // Trigger sync if days extended or grace period was involved
    console.log(`[${new Date().toISOString()}] Reconnecting Mikrotik user ${user.username} via state-based sync.`);
    // user.isSuspended = false; // This might be handled by user.status = 'active' above
    user.syncStatus = 'pending';
    await user.save({ session }); // Save again to reflect suspension/sync status

    const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');
    await mikrotikSyncQueue.add('syncUser', {
      mikrotikUserId: user._id,
      tenantId: user.tenant,
    });
  }

  try {
    console.log(`[${new Date().toISOString()}] Sending payment acknowledgement SMS.`);
    await sendAcknowledgementSms(
      smsTriggers.PAYMENT_RECEIVED.name,
      user.mobileNumber,
      {
        officialName: user.officialName,
        amountPaid: amountPaid,
        walletBalance: user.walletBalance.toFixed(2),
        userId: user.user,
        tenant: user.tenant,
        mikrotikUser: user._id,
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to send payment acknowledgement SMS for user ${user.username}:`, error);
  }

  console.log(`[${new Date().toISOString()}] Payment processing complete for ${user.username}.`);
};

module.exports = { processSubscriptionPayment };