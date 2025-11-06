const mongoose = require('mongoose');

const stkRequestSchema = new mongoose.Schema({
  tenantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkoutRequestId: {
    type: String,
    required: true,
    unique: true,
  },
  accountReference: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    default: 'SUBSCRIPTION', // e.g., SUBSCRIPTION, HOTSPOT
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotspotPlan',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '5m', // Automatically delete after 5 minutes
  },
});

module.exports = mongoose.model('StkRequest', stkRequestSchema);
