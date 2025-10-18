const mongoose = require('mongoose');

const downtimeLogSchema = new mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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

const DowntimeLog = mongoose.model('DowntimeLog', downtimeLogSchema);

module.exports = DowntimeLog;
