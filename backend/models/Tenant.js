const mongoose = require('mongoose');

const TenantSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active',
  },
  // Future fields can be added here, e.g.:
  // address: { street: String, city: String, country: String },
  // billingInfo: { plan: String, stripeCustomerId: String },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Tenant', TenantSchema);
