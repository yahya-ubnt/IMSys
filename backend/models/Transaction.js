const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    officialName: {
      type: String,
      required: true,
    },
    msisdn: {
      type: String,
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['M-Pesa', 'Cash'],
    },
    balance: {
      type: Number,
      required: false,
    },
    comment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ tenant: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
