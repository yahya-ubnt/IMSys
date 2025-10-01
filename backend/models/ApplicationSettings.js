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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ApplicationSettings', ApplicationSettingsSchema);