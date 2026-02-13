const mongoose = require('mongoose');

const MikrotikUserSchema = mongoose.Schema(
  {
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
    
  },
  {
    timestamps: true,
  }
);

MikrotikUserSchema.index({ tenant: 1 });
MikrotikUserSchema.index({ tenant: 1, username: 1 }, { unique: true });
MikrotikUserSchema.index({ tenant: 1, mPesaRefNo: 1 }, { unique: true });
MikrotikUserSchema.index({ tenant: 1, macAddress: 1 }, { 
  unique: true, 
  partialFilterExpression: { macAddress: { $exists: true, $ne: null } } 
});

module.exports = mongoose.model('MikrotikUser', MikrotikUserSchema);
