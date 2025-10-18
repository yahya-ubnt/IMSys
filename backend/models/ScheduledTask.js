const mongoose = require('mongoose');

const ScheduledTaskSchema = new mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scriptPath: {
      type: String,
      required: true,
    },
    schedule: {
      type: String,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    lastRun: {
      type: Date,
    },
    lastStatus: {
      type: String,
      enum: ['Success', 'Failed', 'Pending', 'Running'],
      default: 'Pending',
    },
    logOutput: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScheduledTask', ScheduledTaskSchema);
