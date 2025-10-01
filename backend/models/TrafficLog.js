const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MikrotikUser',
    required: true,
  },
  date: { // We will store daily aggregated data
    type: Date,
    required: true,
  },
  upload: { // bytes
    type: Number,
    default: 0,
  },
  download: { // bytes
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for efficient querying
trafficLogSchema.index({ user: 1, date: -1 });

const TrafficLog = mongoose.model('TrafficLog', trafficLogSchema);

module.exports = TrafficLog;
