const mongoose = require('mongoose');

const SmsTemplateSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: [true, 'Please add a template name'],
      trim: true,
    },
    messageBody: {
      type: String,
      required: [true, 'Please add a message body for the template'],
    }
  },
  {
    timestamps: true,
  }
);

SmsTemplateSchema.index({ tenant: 1 });
SmsTemplateSchema.index({ tenant: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SmsTemplate', SmsTemplateSchema);
