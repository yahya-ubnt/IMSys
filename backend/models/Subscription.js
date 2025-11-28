const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    mikrotikUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MikrotikUser',
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['Monthly', 'Quarterly', 'Annually'],
      default: 'Monthly',
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Suspended', 'Cancelled'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ mikrotikUser: 1, status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
