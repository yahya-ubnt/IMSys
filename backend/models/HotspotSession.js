const mongoose = require('mongoose');

const HotspotSessionSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    macAddress: {
      type: String,
      required: true,
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

HotspotSessionSchema.index({ tenant: 1, macAddress: 1 }, { unique: true });

module.exports = mongoose.model('HotspotSession', HotspotSessionSchema);
