const mongoose = require('mongoose');
const { encrypt } = require('../utils/crypto');

const deviceSchema = new mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
      unique: true,
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
    location: {
      type: String,
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

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
