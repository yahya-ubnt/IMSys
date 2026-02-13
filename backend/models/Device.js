const mongoose = require('mongoose');
const { encrypt } = require('../utils/crypto');

const deviceSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    router: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MikrotikRouter',
    },
    ipAddress: {
      type: String,
      required: [true, 'Please provide an IP address'],
    },
    macAddress: {
      type: String,
      required: [true, 'Please provide a MAC address'],
    },
    deviceType: {
      type: String,
      required: true,
      enum: ['Access', 'Station'],
    },
    status: {
      type: String,
      required: true,
      enum: ['UP', 'DOWN'],
      default: 'DOWN',
    },
    lastSeen: {
      type: Date,
    },
    physicalBuilding: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
    },
    serviceArea: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
      },
    ],
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device', // Self-reference for hierarchy
    },
    deviceName: {
      type: String,
    },
    deviceModel: {
      type: String,
    },
    loginUsername: {
      type: String,
    },
    loginPassword: {
      type: String,
    },
    ssid: {
      type: String,
    },
    wirelessPassword: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Use a virtual for 'deviceId' to match the spec's naming convention without altering the DB schema
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for device_id to return the _id
deviceSchema.virtual('deviceId').get(function() {
  return this._id.toHexString();
});

// Encrypt passwords before saving
deviceSchema.pre('save', function (next) {
  if (this.isModified('loginPassword') && this.loginPassword) {
    this.loginPassword = encrypt(this.loginPassword);
  }
  if (this.isModified('wirelessPassword') && this.wirelessPassword) {
    this.wirelessPassword = encrypt(this.wirelessPassword);
  }
  next();
});

deviceSchema.index({ tenant: 1 });
deviceSchema.index({ tenant: 1, macAddress: 1 }, { unique: true });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
