const mongoose = require('mongoose');

const SmsAcknowledgementSchema = mongoose.Schema(
  {
    triggerType: {
      type: String,
      required: [true, 'Please specify the trigger type'],
      unique: true,
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

module.exports = mongoose.model('SmsAcknowledgement', SmsAcknowledgementSchema);
