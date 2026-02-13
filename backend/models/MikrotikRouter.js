const mongoose = require('mongoose');

const MikrotikRouterSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: [true, 'Please add a name for the router'],
      trim: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'Please add an IP address'],
      match: [/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please use a valid IP address'],
    },
    apiUsername: {
      type: String,
      required: [true, 'Please add an API username'],
    },
    apiPassword: {
      type: String,
      required: [true, 'Please add an API password'],
    },
    apiPort: {
      type: Number,
      required: [true, 'Please add an API port'],
      default: 8728,
    },
    location: {
      type: String,
      required: false,
    },
    isCoreRouter: {
      type: Boolean,
      default: false,
    },
    tunnelIp: {
      type: String,
      match: [/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please use a valid IP address'],
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

MikrotikRouterSchema.index({ tenant: 1 });
MikrotikRouterSchema.index({ tenant: 1, ipAddress: 1 }, { unique: true });

module.exports = mongoose.model('MikrotikRouter', MikrotikRouterSchema);
