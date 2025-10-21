const mongoose = require('mongoose');

const ApplicationSettingsSchema = mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // Each user should have only one settings document
    },
    appName: {
      type: String,
      required: true,
      default: "MEDIATEK",
    },
    slogan: {
      type: String,
      default: "MANAGEMENT SYSTEM",
    },
    logoIcon: {
      type: String,
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
      environment: { type: String, default: 'sandbox' },
      paybillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false },
      callbackURL: { type: String, trim: true }
    },
    mpesaTill: {
      environment: { type: String, default: 'sandbox' },
      tillStoreNumber: { type: String, trim: true },
      tillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false }
    },
    adminNotificationEmails: {
      type: [String],
      default: []
    },
    smtpSettings: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      pass: { type: String, default: "" }, // Encrypted
      from: { type: String, default: "" }
    },
    logRetentionDays: {
      sms: { type: Number, default: 180 },
      diagnostic: { type: Number, default: 90 },
      userDowntime: { type: Number, default: 180 },
      traffic: { type: Number, default: 60 },
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApplicationSettings', ApplicationSettingsSchema);