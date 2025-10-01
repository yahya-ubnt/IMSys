const mongoose = require('mongoose');

const userDowntimeLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MikrotikUser',
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

const UserDowntimeLog = mongoose.model('UserDowntimeLog', userDowntimeLogSchema);

module.exports = UserDowntimeLog;
