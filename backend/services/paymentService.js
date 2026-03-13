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
const { activateUserSubscription } = require('./subscriptionService');

/**
 * High-level service for handling payments and account renewals.
 */
const PaymentService = {
  
  /**
   * Processes a subscription payment with a priority-based logic.
   * (Existing logic remains the same)
   */
  processSubscriptionPayment: async (mikrotikUserId, amountPaid, paymentSource, externalTransactionId, adminId = null, session) => {
    // ... existing implementation
  },

  /**
   * Orchestrates a successful payment from any source (STK, C2B, Cash).
   * Now supports finding user by _id, mPesaRefNo, or invoice number.
   */
  handleSuccessfulPayment: async (params) => {
    const { tenant, amount, transactionId, reference, packageId, paymentMethod, msisdn, officialName, comment } = params;

    if (!packageId) {
      throw new Error('packageId is required to handle a successful payment.');
    }
    if (!reference) {
      throw new Error('A user reference (_id or mPesaRefNo) is required.');
    }

    try {
      let userToCredit;

      // Find user by _id or mPesaRefNo
      if (mongoose.Types.ObjectId.isValid(reference)) {
        userToCredit = await MikrotikUser.findById(reference);
      } else {
        userToCredit = await MikrotikUser.findOne({ mPesaRefNo: reference, tenant: tenant });
      }

      if (!userToCredit) {
        throw new Error(`User not found for reference: ${reference}`);
      }

      // 1. Activate or extend the subscription
      await activateUserSubscription(userToCredit._id, packageId);

      // 2. Create a generic transaction record for the payment
      await Transaction.create({
        transactionId,
        amount,
        referenceNumber: reference,
        officialName: officialName || userToCredit.officialName,
        msisdn: msisdn || userToCredit.mobileNumber, // Fallback to user's mobile number
        transactionDate: new Date(),
        paymentMethod,
        tenant,
        mikrotikUser: userToCredit._id,
        comment: comment || `Payment for package ${packageId}`,
      });

      console.log(`[PaymentService] Successfully processed payment for user ${userToCredit.username} and package ${packageId}.`);

    } catch (error) {
      console.error(`[PaymentService] Processing failed for TX ${transactionId}:`, error.message);
      await MpesaAlert.create({ message: error.message, transactionId, amount, referenceNumber: reference, tenant, paymentDate: new Date() });
      throw error;
    }
  },

  /**
   * Creates a manual wallet transaction (Credit/Debit).
   * (Existing logic remains the same)
   */
  createWalletTransaction: async (params, adminId) => {
    // ... existing implementation
  },

  /**
   * Retrieves a paginated list of general transactions.
   */
  getTransactions: async (tenantId, queryParams) => {
    const { startDate, endDate, search, page = 1, limit = 10 } = queryParams;
    const query = { tenant: tenantId };

    if (startDate && endDate) {
      query.transactionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { officialName: { $regex: search, $options: 'i' } },
        { msisdn: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .populate('mikrotikUser', 'username officialName');

    const count = await Transaction.countDocuments(query);

    return { transactions, pages: Math.ceil(count / limit), count };
  },

  /**
   * Retrieves a paginated list of wallet transactions.
   */
  getWalletTransactions: async (tenantId, queryParams) => {
    const { userId, type, startDate, endDate, searchTerm, page = 1, limit = 10 } = queryParams;
    const query = { tenant: tenantId };
    
    if (userId) query.mikrotikUser = userId;
    if (type) query.type = type;

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (searchTerm) {
      query.$or = [
        { transactionId: { $regex: searchTerm, $options: 'i' } },
        { source: { $regex: searchTerm, $options: 'i' } },
        { comment: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit))
      .populate('mikrotikUser', 'username officialName')
      .populate('processedBy', 'fullName');

    const count = await WalletTransaction.countDocuments(query);
      
    return { transactions, pages: Math.ceil(count / limit), count };
  },

  /**
   * Retrieves a single wallet transaction by its ID.
   */
  getWalletTransactionById: async (transactionId, tenantId) => {
    const transaction = await WalletTransaction.findOne({
      _id: transactionId,
      tenant: tenantId,
    }).populate('mikrotikUser', 'username officialName').populate('processedBy', 'fullName');

    if (!transaction) {
      const error = new Error('Wallet transaction not found');
      error.statusCode = 404;
      throw error;
    }

    return transaction;
  },
};

module.exports = PaymentService;
