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
      unique: true
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

module.exports = mongoose.model('SmsTemplate', SmsTemplateSchema);
