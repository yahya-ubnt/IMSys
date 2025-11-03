const mongoose = require('mongoose');

const hotspotUserSchema = new mongoose.Schema({
  officialName: { type: String, required: true },
  email: { type: String },
  location: { type: String },
  hotspotName: { type: String, required: true, unique: true },
  hotspotPassword: { type: String, required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'HotspotPlan', required: true },
  server: { type: String, required: true },
  profile: { type: String, required: true },
  referenceNumber: { type: String, required: true, unique: true },
  billAmount: { type: Number, required: true },
  installationFee: { type: Number, default: 0 },
  billingCycleValue: { type: Number, required: true },
  billingCycleUnit: { type: String, enum: ['days', 'weeks', 'months', 'year'], required: true },
  phoneNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  expiryTime: { type: String, required: true }, // Storing time as a string e.g., "23:59"
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mikrotikRouter: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikRouter', required: true },
}, {
  timestamps: true,
});

const HotspotUser = mongoose.model('HotspotUser', hotspotUserSchema);

module.exports = HotspotUser;
