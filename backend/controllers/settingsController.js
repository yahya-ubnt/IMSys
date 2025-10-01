const asyncHandler = require('express-async-handler');
const ApplicationSettings = require('../models/ApplicationSettings');

// @desc    Get application branding settings
// @route   GET /api/settings/branding
// @access  Private
const getBrandingSettings = asyncHandler(async (req, res) => {
  const settings = await ApplicationSettings.findOne();

  if (settings) {
    res.json(settings);
  } else {
    // If no settings exist, create default ones
    const defaultSettings = await ApplicationSettings.create({
      appName: "MEDIATEK MANAGEMENT SYSTEM",
      logoIcon: "/globe.svg", // Default logo image path
    });
    res.json(defaultSettings);
  }
});

// @desc    Update application branding settings
// @route   PUT /api/settings/branding
// @access  Private/Admin
const updateBrandingSettings = asyncHandler(async (req, res) => {
  const { appName, logoIcon } = req.body; // logoIcon from body will be present if no new file is uploaded

  let settings = await ApplicationSettings.findOne();

  if (settings) {
    settings.appName = appName || settings.appName;

    // Handle logoIcon based on file upload or body data
    if (req.file) {
      // A new logo file was uploaded
      settings.logoIcon = `/${req.file.path}`; // Store the path to the uploaded file
    } else if (logoIcon) {
      // No new file, but logoIcon was sent in the body (e.g., keeping existing or default Lucide icon)
      settings.logoIcon = logoIcon;
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } else {
    // If no settings exist, create new ones
    const newSettings = await ApplicationSettings.create({
      appName,
      logoIcon: req.file ? `/${req.file.path}` : logoIcon, // Use uploaded file path or body logoIcon
    });
    res.status(201).json(newSettings);
  }
});

module.exports = {
  getBrandingSettings,
  updateBrandingSettings,
};