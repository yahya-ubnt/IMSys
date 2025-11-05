const mongoose = require('mongoose');

const HotspotTransactionSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HotspotTransaction', HotspotTransactionSchema);
