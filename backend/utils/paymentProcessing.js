const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const { reconnectMikrotikUser } = require('./mikrotikUtils');

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
  const user = await MikrotikUser.findById(mikrotikUserId).populate('package');

  if (!user) {
    throw new Error(`User not found for payment processing: ${mikrotikUserId}`);
  }

  // 1. Credit the full amount to the user's wallet
  const initialBalance = user.walletBalance;
  user.walletBalance += amountPaid;

  await WalletTransaction.create({
    user: user.user,
    mikrotikUser: user._id,
    transactionId: `WT-CREDIT-${Date.now()}`,
    type: 'Credit',
    amount: amountPaid,
    source: paymentSource,
    balanceAfter: user.walletBalance,
    comment: `Payment received. Original TX ID: ${externalTransactionId}`,
    processedBy: adminId,
  });

  if (!user.package || !user.package.price || user.package.price <= 0) {
    console.warn(`User ${user.username} has no valid package price. Amount credited to wallet.`);
    await user.save();
    return;
  }

  const packagePrice = user.package.price;
  let daysExtended = 0;
  const now = new Date();

  // 2. Pay for one month of service if the subscription is expired and wallet has sufficient funds
  let newExpiryDate = new Date(user.expiryDate || now);
  if (newExpiryDate < now && user.walletBalance >= packagePrice) {
    user.walletBalance -= packagePrice;
    newExpiryDate = new Date(now);
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
    user.expiryDate = newExpiryDate;
    daysExtended += 30;

    await WalletTransaction.create({
      user: user.user,
      mikrotikUser: user._id,
      transactionId: `DEBIT-RENEW-${Date.now()}`,
      type: 'Debit',
      amount: packagePrice,
      source: 'Subscription Renewal',
      balanceAfter: user.walletBalance,
      comment: 'Automatic renewal of 1 month.',
      processedBy: null, // System-processed
    });
  }

  // 3. Pay off any outstanding debt (already handled by crediting the wallet)

  // 4. Buy future months of service with any remainder
  if (user.walletBalance >= packagePrice) {
    const futureMonthsToBuy = Math.floor(user.walletBalance / packagePrice);
    const costOfFutureMonths = futureMonthsToBuy * packagePrice;

    if (futureMonthsToBuy > 0) {
      let currentExpiry = new Date(user.expiryDate);
      currentExpiry.setDate(currentExpiry.getDate() + (futureMonthsToBuy * 30));
      user.expiryDate = currentExpiry;
      daysExtended += futureMonthsToBuy * 30;

      user.walletBalance -= costOfFutureMonths;

      await WalletTransaction.create({
        user: user.user,
        mikrotikUser: user._id,
        transactionId: `DEBIT-FUTURE-${Date.now()}`,
        type: 'Debit',
        amount: costOfFutureMonths,
        source: 'Subscription Purchase',
        balanceAfter: user.walletBalance,
        comment: `Automatic purchase of ${futureMonthsToBuy} future month(s).`,
        processedBy: null, // System-processed
      });
    }
  }

  await user.save();

  if (daysExtended > 0) {
    await reconnectMikrotikUser(user._id);
  }

  console.log(`Payment processing complete for ${user.username}. Service extended by ${daysExtended} days. New balance: ${user.walletBalance.toFixed(2)}`);
};

module.exports = { processSubscriptionPayment };