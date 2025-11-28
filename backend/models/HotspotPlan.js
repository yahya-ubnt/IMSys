const mongoose = require('mongoose');

const hotspotPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant', // Refers to the Tenant
    required: true,
  },
  mikrotikRouter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MikrotikRouter',
    required: true,
  },
  timeLimitValue: {
    type: Number,
    required: true,
  },
  timeLimitUnit: {
    type: String,
    enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'year'],
    required: true,
  },
  server: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
    required: true,
  },
  rateLimit: {
    type: String,
  },
  dataLimitValue: {
    type: Number,
    default: 0,
  },
  dataLimitUnit: {
    type: String,
    enum: ['MB', 'GB'],
  },
  sharedUsers: {
    type: Number,
    required: true,
    default: 1,
  },
  validDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  showInCaptivePortal: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

hotspotPlanSchema.index({ tenant: 1 });

const HotspotPlan = mongoose.model('HotspotPlan', hotspotPlanSchema);

module.exports = HotspotPlan;
