const mongoose = require('mongoose');

const smsLogSchema = mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['Acknowledgement', 'Expiry Alert', 'Compose New Message', 'System'],
      default: 'System',
    },
    smsStatus: {
      type: String,
      enum: ['Success', 'Failed', 'Pending'],
      default: 'Pending',
    },
    providerResponse: {
      type: Object,
    },
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SmsLog = mongoose.model('SmsLog', smsLogSchema);

module.exports = SmsLog;