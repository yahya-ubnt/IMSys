const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  profile: { type: String, required: true },
  price: { type: Number, required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  mikrotikRouter: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikRouter', required: true },
  batch: { type: String, required: true }, // To group vouchers generated at the same time
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active',
  },
  usedByMacAddress: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

voucherSchema.index({ tenant: 1 });

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;
