const mongoose = require('mongoose');

const MpesaTransactionSchema = mongoose.Schema(
  {
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
    balance: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MpesaTransaction', MpesaTransactionSchema);
