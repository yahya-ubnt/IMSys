const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: { type: String },
    phoneNumber: { type: String, required: true, unique: true },
    leadSource: {
      type: String,
      enum: [
        'Caretaker/House Manager',
        'Field Sales',
        'Referral',
        'Website',
        'WhatsApp/SMS',
        'Manual Entry',
        'Manual',
      ],
      required: true,
    },
    desiredPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    },
    currentIsp: { type: String },
    notes: { type: String },
    broughtInBy: { type: String },
    broughtInByContact: { type: String },
    agreedInstallationFee: { type: Number },
    agreedMonthlySubscription: { type: Number },
    totalAmount: { type: Number },
    customerHasRouter: { type: Boolean, default: false },
    routerType: { type: String },
    followUpDate: { type: Date },
    status: {
      type: String,
      enum: [
        'New',
        'Contacted',
        'Interested',
        'Site Survey Scheduled',
        'Converted',
        'Not Interested',
        'Future Prospect',
      ],
      default: 'New',
    },
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    isConverted: { type: Boolean, default: false },
    mikrotikUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MikrotikUser',
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;