const mongoose = require('mongoose');

const SmsAcknowledgementSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    triggerType: {
      type: String,
      required: [true, 'Please specify the trigger type'],
      trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    smsTemplate: {
      type: mongoose.Schema.ObjectId,
      ref: 'SmsTemplate',
      required: [true, 'Please link an SMS template'],
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    }
  },
  {
    timestamps: true,
  }
);

SmsAcknowledgementSchema.index({ triggerType: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('SmsAcknowledgement', SmsAcknowledgementSchema);
