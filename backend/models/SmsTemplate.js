const mongoose = require('mongoose');

const SmsTemplateSchema = mongoose.Schema(
  {
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

module.exports = mongoose.model('SmsTemplate', SmsTemplateSchema);
