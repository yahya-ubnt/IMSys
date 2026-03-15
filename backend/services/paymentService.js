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
   * @deprecated This function is deprecated. Use the processSubscriptionPayment utility from /utils/paymentProcessing.js instead.
   */
  handleSuccessfulPayment: async (params) => {
    throw new Error('handleSuccessfulPayment is deprecated and should not be used. All payments must now go through the unified wallet system via processSubscriptionPayment.');
  },

  /**
   * Creates a manual wallet transaction (Credit/Debit).
   * (Existing logic remains the same)
   */
  createWalletTransaction: async (params, adminId) => {
    const { tenant, mikrotikUser, type, amount, source, comment } = params;

    if (!mikrotikUser || !type || !amount || !source) {
      const error = new Error('Missing required fields for wallet transaction.');
      error.statusCode = 400;
      throw error;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await MikrotikUser.findById(mikrotikUser).session(session);
      if (!user) {
        throw new Error('User not found for wallet transaction.');
      }

      const balanceBefore = user.walletBalance;
      let balanceAfter;

      // Calculate the new balance
      if (type === 'Credit') {
        balanceAfter = balanceBefore + amount;
      } else if (type === 'Debit') {
        balanceAfter = balanceBefore - amount;
      } else { // For 'Adjustment' or other types
        const error = new Error('Invalid transaction type for automatic balance adjustment.');
        error.statusCode = 400;
        throw error;
      }
      
      user.walletBalance = balanceAfter;

      const transactionId = `WT-${type.toUpperCase()}-${randomUUID()}`;
      const transaction = new WalletTransaction({
        tenant,
        mikrotikUser,
        transactionId,
        type,
        amount,
        source,
        balanceAfter,
        comment,
        processedBy: adminId,
      });

      await transaction.save({ session });
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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
