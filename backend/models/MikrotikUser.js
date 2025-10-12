const mongoose = require('mongoose');

const MikrotikUserSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Connection & Service Details
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
    package: {
      type: mongoose.Schema.ObjectId,
      ref: 'Package',
      required: true,
    },
    station: {
      type: mongoose.Schema.ObjectId,
      ref: 'Device',
    },
    username: {
      type: String,
      required: true,
      unique: true, // The username for the Mikrotik service should be unique
    },
    pppoePassword: {
      type: String,
      // Not necessarily encrypted in DB, as it needs to be sent to Mikrotik
      // Required for PPPoE, validation handled in controller
    },
    remoteAddress: {
        type: String,
        // Optional for PPPoE
    },
    ipAddress: {
        type: String,
        // Required for Static IP, validation handled in controller
    },

    // Personal & Billing Information
    officialName: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    apartment_house_number: {
      type: String,
    },
    door_number_unit_label: {
      type: String,
    },
    mPesaRefNo: {
      type: String,
      required: true,
      unique: true, // This must be unique for payment reconciliation
    },
    installationFee: {
      type: Number,
      default: 0,
    },
    billingCycle: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
      expiryDate: {
    type: Date,
    required: true,
  },
  walletBalance: {
    type: Number,
    required: true,
    default: 0,
  },

    // System-managed fields
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastChecked: {
      type: Date,
    },
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MikrotikUser', MikrotikUserSchema);
