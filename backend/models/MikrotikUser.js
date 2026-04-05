const mongoose = require('mongoose');
const Counter = require('./Counter'); // Import the counter model

const MikrotikUserSchema = mongoose.Schema(
  {
    userNumber: { // The new human-readable, auto-incrementing ID
      type: Number,
      unique: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
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
    building: {
      type: mongoose.Schema.ObjectId,
      ref: 'Building',
    },
    station: {
      type: mongoose.Schema.ObjectId,
      ref: 'Device',
    },
    username: {
      type: String,
      required: true,
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
    macAddress: {
        type: String,
        // Required for Static IP (DHCP Lease), validation handled in controller
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
    },
    installationFee: {
      type: Number,
      default: 0,
    },
    installationFeePaid: {
      type: Boolean,
      default: false,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    customPackagePrice: { // New field for user-specific package price
      type: Number,
      min: [0, 'Custom package price cannot be negative'],
    },
      expiryDate: {
    type: Date,
    required: true,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  pauseDate: {
    type: Date,
  },
  remainingDaysAtPause: { // Stored in milliseconds for higher precision
    type: Number,
  },
  prePauseExpiryDate: {
    type: Date,
  },
  walletBalance: {
    type: Number,
    required: true,
    default: 0,
  },

    // System-managed fields
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    isManuallyDisconnected: {
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
    provisionedOnMikrotik: {
      type: Boolean,
      default: false,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'synced',
    },
    syncErrorMessage: {
      type: String,
    },
    lastSyncedAt: {
      type: Date,
    },
    pendingPackage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Package',
    },
    // Grace Period Fields
    gracePeriodEnabled: {
      type: Boolean,
      default: false,
    },
    expectedPaymentDate: {
      type: Date,
    },
    gracePeriodOriginalExpiryDate: {
      type: Date,
    },
    gracePeriodDaysUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to auto-increment userNumber before saving
MikrotikUserSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'mikrotik-user' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.userNumber = counter.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

MikrotikUserSchema.index({ userNumber: 1 }, { unique: true });
MikrotikUserSchema.index({ tenant: 1 });
MikrotikUserSchema.index({ tenant: 1, username: 1 }, { unique: true });
MikrotikUserSchema.index({ tenant: 1, mPesaRefNo: 1 }, { unique: true });
MikrotikUserSchema.index({ tenant: 1, macAddress: 1 }, { 
  unique: true, 
  partialFilterExpression: { macAddress: { $exists: true, $ne: null } } 
});

module.exports = mongoose.model('MikrotikUser', MikrotikUserSchema);
