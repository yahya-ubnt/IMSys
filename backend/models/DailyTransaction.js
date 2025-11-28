const mongoose = require('mongoose');

const dailyTransactionSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['M-Pesa', 'Bank', 'Cash'],
    },
    transactionMessage: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    label: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    transactionDate: {
      type: Date,
      required: false,
    },
    transactionTime: {
      type: String,
      required: false,
    },
    receiverEntity: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    transactionCost: {
      type: Number,
      required: false,
    },
    category: {
      type: String,
      required: true,
      enum: ['Personal', 'Company'],
      default: 'Personal', // Default to Personal if not provided
    },
  },
  {
    timestamps: true,
  }
);

dailyTransactionSchema.index({ tenant: 1 });

const DailyTransaction = mongoose.model('DailyTransaction', dailyTransactionSchema);

module.exports = DailyTransaction;
