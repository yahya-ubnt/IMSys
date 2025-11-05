const mongoose = require('mongoose');

const HotspotSessionSchema = new mongoose.Schema(
  {
    macAddress: {
      type: String,
      required: true,
      unique: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HotspotPlan',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    dataUsage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HotspotSession', HotspotSessionSchema);
