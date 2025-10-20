const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    mikrotikUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MikrotikUser',
    },
    smsExpirySchedule: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'SmsExpirySchedule',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to quickly find if a notification has been sent
NotificationLogSchema.index({ mikrotikUser: 1, smsExpirySchedule: 1 });

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
