const mongoose = require('mongoose');

const SmsTemplateSchema = mongoose.Schema(
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
    messageBody: {
      type: String,
      required: [true, 'Please add a message body for the template'],
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

SmsTemplateSchema.index({ tenant: 1 });
SmsTemplateSchema.index({ triggerType: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('SmsTemplate', SmsTemplateSchema);
