const mongoose = require('mongoose');

const PackageSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    mikrotikRouter: {
      type: mongoose.Schema.ObjectId,
      ref: 'MikrotikRouter',
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['pppoe', 'static'],
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a package name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price for the package'],
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      required: true,
      default: 'active',
    },
    profile: {
      type: String,
      // Required for PPPoE, but validation is handled at the controller level
    },
    rateLimit: {
      type: String,
      // Required for Static IP, but validation is handled at the controller level
    }
  },
  {
    timestamps: true,
  }
);

PackageSchema.index({ tenant: 1 });

module.exports = mongoose.model('Package', PackageSchema);
