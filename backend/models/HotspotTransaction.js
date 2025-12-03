const mongoose = require('mongoose');

const HotspotTransactionSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HotspotPlan',
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    macAddress: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have a null value for this field
    },
  },
  {
    timestamps: true,
  }
);

HotspotTransactionSchema.index({ tenant: 1 });

module.exports = mongoose.model('HotspotTransaction', HotspotTransactionSchema);
