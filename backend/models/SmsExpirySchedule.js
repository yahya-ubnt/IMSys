const mongoose = require('mongoose');

const SmsExpiryScheduleSchema = mongoose.Schema(
  {
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
    messageBody: {
      type: String,
      required: [true, 'Please add a message body for the schedule.'],
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

module.exports = mongoose.model('SmsExpirySchedule', SmsExpiryScheduleSchema);
