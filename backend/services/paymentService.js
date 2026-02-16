const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const moment = require('moment');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const MpesaAlert = require('../models/MpesaAlert');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');
const { sendAcknowledgementSms } = require('./smsService');
const smsTriggers = require('../constants/smsTriggers');

/**
 * High-level service for handling payments and account renewals.
 */
const PaymentService = {
  
  /**
   * Processes a subscription payment with a priority-based logic.
   * 1. Credits the full amount to the user's wallet.
   * 2. Pays for one month of service if the subscription is expired.
   * 3. Buys future months of service with any remainder.
   */
  processSubscriptionPayment: async (mikrotikUserId, amountPaid, paymentSource, externalTransactionId, adminId = null, session) => {
    console.log(`[PaymentService] Processing payment for user ${mikrotikUserId} (${amountPaid})`);
    
    // 1. Credit wallet
    const user = await MikrotikUser.findByIdAndUpdate(
      mikrotikUserId,
      { $inc: { walletBalance: amountPaid } },
      { new: true, session }
    ).populate('package');

    if (!user) throw new Error(`User not found: ${mikrotikUserId}`);

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

    if (!user.package || !user.package.price || user.package.price <= 0) return;

    const packagePrice = user.package.price;
    let monthsExtended = 0;
    const now = moment();
    let newExpiryDate = moment(user.expiryDate || now);

    // 2. Pay for one month if expired
    if (newExpiryDate.isBefore(now) && user.walletBalance >= packagePrice) {
      user.walletBalance -= packagePrice;
      newExpiryDate = now.add(1, 'months');
      user.expiryDate = newExpiryDate.toDate();
      monthsExtended += 1;

      await WalletTransaction.create([{
        tenant: user.tenant,
        mikrotikUser: user._id,
        transactionId: `DEBIT-RENEW-${randomUUID()}`,
        type: 'Debit',
        amount: packagePrice,
        source: 'Subscription Renewal',
        balanceAfter: user.walletBalance,
        comment: 'Automatic renewal of 1 month.',
      }], { session });
    }

    // 3. Buy future months
    if (user.walletBalance >= packagePrice) {
      const futureMonthsToBuy = Math.floor(user.walletBalance / packagePrice);
      if (futureMonthsToBuy > 0) {
        const costOfFutureMonths = futureMonthsToBuy * packagePrice;
        let currentExpiry = moment(user.expiryDate);
        user.expiryDate = currentExpiry.add(futureMonthsToBuy, 'months').toDate();
        monthsExtended += futureMonthsToBuy;
        user.walletBalance -= costOfFutureMonths;

        await WalletTransaction.create([{
          tenant: user.tenant,
          mikrotikUser: user._id,
          transactionId: `DEBIT-FUTURE-${randomUUID()}`,
          type: 'Debit',
          amount: costOfFutureMonths,
          source: 'Subscription Purchase',
          balanceAfter: user.walletBalance,
          comment: `Automatic purchase of ${futureMonthsToBuy} future month(s).`,
        }], { session });
      }
    }

    // --- State-Based Sync Logic ---
    // If the user was suspended and now has an active subscription, mark for sync
    if (monthsExtended > 0 && user.isSuspended && !user.isManuallyDisconnected) {
      user.isSuspended = false;
      user.syncStatus = 'pending';
    }

    await user.save({ session });

    // 4. Trigger Hardware Sync (Asynchronous)
    if (user.syncStatus === 'pending') {
      await mikrotikSyncQueue.add('syncUser', { 
        mikrotikUserId: user._id, 
        tenantId: user.tenant 
      });
    }

    // 5. Send Notification
    try {
      await sendAcknowledgementSms(smsTriggers.PAYMENT_RECEIVED, user.mobileNumber, {
        officialName: user.officialName,
        amountPaid: amountPaid,
        walletBalance: user.walletBalance.toFixed(2),
        tenant: user.tenant,
        mikrotikUser: user._id,
      });
    } catch (e) {
      console.error('[PaymentService] SMS failed:', e.message);
    }
  },

  /**
   * Orchestrates a successful payment (from any source).
   */
  handleSuccessfulPayment: async (params) => {
    const { tenant, amount, transactionId, reference, paymentMethod, msisdn, officialName, comment } = params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let userToCredit;
      let finalComment = comment;

      if (reference.startsWith('INV-')) {
        const invoice = await Invoice.findOne({ 
          invoiceNumber: reference, 
          status: { $in: ['Unpaid', 'Overdue'] }, 
          tenant: tenant 
        }).session(session).populate('mikrotikUser');

        if (!invoice) throw new Error(`Invoice not found or already paid: ${reference}`);
        
        invoice.status = 'Paid';
        invoice.paidDate = new Date();
        await invoice.save({ session });
        
        userToCredit = invoice.mikrotikUser;
        finalComment = `Payment for Invoice #${reference}`;
      } else {
        userToCredit = await MikrotikUser.findOne({ mPesaRefNo: reference, tenant: tenant }).session(session);
      }

      if (!userToCredit) throw new Error(`User not found for reference: ${reference}`);

      await PaymentService.processSubscriptionPayment(userToCredit._id, amount, paymentMethod, transactionId, null, session);

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
    } catch (error) {
      await session.abortTransaction();
      console.error(`[PaymentService] Processing failed for TX ${transactionId}:`, error.message);
      await MpesaAlert.create({ message: error.message, transactionId, amount, referenceNumber: reference, tenant, paymentDate: new Date() });
    } finally {
      session.endSession();
    }
  },

  /**
   * Creates a manual wallet transaction (Credit/Debit).
   */
  createWalletTransaction: async (params, adminId) => {
    const { userId, type, amount, source, comment, tenant } = params;
    const parsedAmount = parseFloat(amount);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let updatedUser;
      const transactionId = `WT-${type.toUpperCase()}-${randomUUID()}`;

      if (type === 'Credit') {
        updatedUser = await MikrotikUser.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: parsedAmount } },
          { new: true, session }
        );
      } else if (type === 'Debit') {
        updatedUser = await MikrotikUser.findOneAndUpdate(
          { _id: userId, walletBalance: { $gte: parsedAmount } },
          { $inc: { walletBalance: -parsedAmount } },
          { new: true, session }
        );
        if (!updatedUser) throw new Error('Insufficient wallet balance.');
      } else {
        throw new Error('Invalid transaction type.');
      }

      if (!updatedUser) throw new Error('User not found.');

      const transaction = await WalletTransaction.create([{
        tenant,
        mikrotikUser: userId,
        type,
        amount: parsedAmount,
        source,
        comment,
        transactionId,
        balanceAfter: updatedUser.walletBalance,
        processedBy: adminId,
      }], { session });

      // After manual wallet update, we might need to trigger a sync 
      // if the balance change affects service status (e.g., if we extension date logic is triggered)
      // For now, we just ensure syncStatus reflects pending if it was manually adjusted for reconnection
      
      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
};

module.exports = PaymentService;
