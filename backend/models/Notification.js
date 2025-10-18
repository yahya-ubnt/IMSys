
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
  tenantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
