
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['device_status', 'system', 'billing', 'ticket'],
    default: 'system',
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread',
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ tenant: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
