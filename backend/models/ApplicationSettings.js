const mongoose = require('mongoose');

const ApplicationSettingsSchema = mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      default: "MEDIATEK MANAGEMENT SYSTEM",
    },
    logoIcon: {
      type: String,
      required: true,
      default: "Wifi", // Default Lucide icon name
    },
    favicon: {
      type: String,
      default: "/favicon.ico",
    },
    paymentGracePeriodDays: {
      type: Number,
      required: true,
      default: 3,
    },
    currencySymbol: {
      type: String,
      required: true,
      default: "KES",
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
    },
    autoDisconnectUsers: {
      type: Boolean,
      required: true,
      default: true,
    },
    sendPaymentReminders: {
      type: Boolean,
      required: true,
      default: true,
    },
    disconnectTime: {
      type: String,
      enum: ['expiry_time', 'end_of_day'],
      default: 'end_of_day',
    },
    companyInfo: {
      name: { type: String, default: "" },
      country: { type: String, default: "Kenya" },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    portalUrls: {
      admin: { type: String, default: "" },
      client: { type: String, default: "" },
    },
    mpesaPaybill: {
      paybillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false }
    },
    mpesaTill: {
      tillStoreNumber: { type: String, trim: true },
      tillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApplicationSettings', ApplicationSettingsSchema);