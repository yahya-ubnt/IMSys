const mongoose = require('mongoose');

const downtimeLogSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Device',
    },
    downStartTime: {
      type: Date,
      required: true,
    },
    downEndTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

downtimeLogSchema.index({ tenant: 1 });

const DowntimeLog = mongoose.model('DowntimeLog', downtimeLogSchema);

module.exports = DowntimeLog;
