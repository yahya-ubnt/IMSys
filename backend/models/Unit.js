// backend/models/Unit.js
const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  label: { type: String },
  visitStatus: { type: String, enum: ['Visited', 'Not Visited'], default: 'Not Visited' },
  provider: { type: String },
  clientName: { type: String },
  phone: { type: String },
  nextBillingDate: { type: Date },
  comments: { type: String },
  wifiName: { type: String },
  wifiPassword: { type: String },
  pppoeUsername: { type: String },
  pppoePassword: { type: String },
  staticIpAddress: { type: String },
  wifiInstallationDate: { type: Date },
  initialPaymentAmount: { type: Number },
  routerOwnership: { type: String, enum: ['Own', 'Provided'] },
  poeAdapter: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, {});

module.exports = mongoose.model('Unit', unitSchema);