const mongoose = require('mongoose');

const SmsExpiryScheduleSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: [true, 'Please add a schedule name'],
      trim: true,
      unique: true
    },
    days: {
      type: Number,
      required: [true, 'Please specify the number of days for the schedule.'],
    },
    timing: {
      type: String,
      required: true,
      enum: ['Before', 'After', 'Not Applicable'],
      default: 'Before',
    },
    smsTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmsTemplate',
      required: [true, 'An SMS template is required as a fallback.'],
    },
    whatsAppTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WhatsAppTemplate',
      required: false, // Optional: for the smart fallback
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

SmsExpiryScheduleSchema.index({ tenant: 1 });

module.exports = mongoose.model('SmsExpirySchedule', SmsExpiryScheduleSchema);
