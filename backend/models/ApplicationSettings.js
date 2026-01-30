const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

// Helper function to handle JSON parsing for getters
const jsonDecrypt = (value) => {
  if (value) {
    try {
      return JSON.parse(decrypt(value));
    } catch (e) {
      console.error("Failed to parse decrypted JSON:", e);
      throw new Error('Failed to decrypt and parse application settings value.');
    }
  }
  return value;
};

// Helper function to handle JSON stringifying for setters
const jsonEncrypt = (value) => {
  if (value && typeof value === 'object') {
    try {
      return encrypt(JSON.stringify(value));
    } catch (e) {
      console.error("Failed to stringify and encrypt JSON:", e);
      throw new Error('Failed to encrypt and stringify application settings value.');
    }
  }
  return value;
};


const ApplicationSettingsSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
      unique: true, // Each tenant should have only one settings document
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
      type: mongoose.Schema.Types.Mixed,
      get: jsonDecrypt,
      set: jsonEncrypt,
    },
    mpesaTill: {
      type: mongoose.Schema.Types.Mixed,
      get: jsonDecrypt,
      set: jsonEncrypt,
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
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

module.exports = mongoose.model('ApplicationSettings', ApplicationSettingsSchema);