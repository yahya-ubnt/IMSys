const mongoose = require('mongoose');

const WalletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mikrotikUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MikrotikUser',
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Credit', 'Debit', 'Adjustment'],
  },
  amount: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    required: true,
    // e.g., 'M-Pesa', 'Cash', 'Monthly Bill', 'HSP Purchase'
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin user who processed it
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
