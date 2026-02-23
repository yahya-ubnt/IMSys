const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    amount, 
    paymentMethod, 
    transactionId, 
    referenceNumber, 
    officialName, 
    msisdn, 
    transactionDate, 
    comment, 
    mikrotikUser 
  } = req.body;

  const transaction = new Transaction({
    amount,
    paymentMethod,
    transactionId,
    referenceNumber,
    officialName,
    msisdn,
    transactionDate: transactionDate || new Date(),
    comment,
    mikrotikUser,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });

  const createdTransaction = await transaction.save();
  res.status(201).json(createdTransaction);
});

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, paymentMethod, search } = req.query;

  const query = { tenant: req.user.tenant };

  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(startDate);
    if (endDate) query.transactionDate.$lte = new Date(endDate);
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  if (search) {
    query.$or = [
      { officialName: { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
      { msisdn: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } },
    ];
  }

  const transactions = await Transaction.find(query).sort({ transactionDate: -1 });
  res.json(transactions);
});

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const transaction = await Transaction.findOne(query);

  if (transaction) {
    res.json(transaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const { 
    amount, 
    paymentMethod, 
    transactionId, 
    referenceNumber, 
    officialName, 
    msisdn, 
    transactionDate, 
    comment 
  } = req.body;

  const transaction = await Transaction.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (transaction) {
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.paymentMethod = paymentMethod || transaction.paymentMethod;
    transaction.transactionId = transactionId || transaction.transactionId;
    transaction.referenceNumber = referenceNumber || transaction.referenceNumber;
    transaction.officialName = officialName || transaction.officialName;
    transaction.msisdn = msisdn || transaction.msisdn;
    transaction.transactionDate = transactionDate || transaction.transactionDate;
    transaction.comment = comment || transaction.comment;

    const updatedTransaction = await transaction.save();
    res.json(updatedTransaction);
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (transaction) {
    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } else {
    res.status(404);
    throw new Error('Transaction not found');
  }
});

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
