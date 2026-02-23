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
      } else if (mongoose.Types.ObjectId.isValid(reference)) {
        // Handle direct user ID reference (for cash payments)
        userToCredit = await MikrotikUser.findById(reference).session(session);
      } else {
        // Fallback to M-Pesa reference number
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
