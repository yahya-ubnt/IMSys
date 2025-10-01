const mongoose = require('mongoose');

const dailyTransactionSchema = mongoose.Schema(
  {
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
      required: true,
    },
    description: {
      type: String,
      required: true,
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

const DailyTransaction = mongoose.model('DailyTransaction', dailyTransactionSchema);

module.exports = DailyTransaction;
