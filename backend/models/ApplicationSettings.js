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
    paymentGracePeriodDays: {
      type: Number,
      required: true,
      default: 3,
    },

    // M-Pesa Fields
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