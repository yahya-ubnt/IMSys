const asyncHandler = require('express-async-handler');
const ApplicationSettings = require('../models/ApplicationSettings');
const { registerCallbackURL } = require('../services/mpesaService');


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

// @desc    Get M-Pesa settings
// @route   GET /api/settings/mpesa
// @access  Private/Admin
const getMpesaSettings = asyncHandler(async (req, res) => {
  const settings = await ApplicationSettings.findOne().select('+mpesaPaybill.consumerKey +mpesaPaybill.consumerSecret +mpesaPaybill.passkey +mpesaTill.consumerKey +mpesaTill.consumerSecret +mpesaTill.passkey');
  res.json({
    mpesaPaybill: settings?.mpesaPaybill,
    mpesaTill: settings?.mpesaTill,
  });
});

// @desc    Update M-Pesa settings
// @route   PUT /api/settings/mpesa
// @access  Private/Admin
const updateMpesaSettings = asyncHandler(async (req, res) => {
  const { type, data } = req.body; // type can be 'paybill' or 'till'

  let settings = await ApplicationSettings.findOne();
  if (!settings) {
    settings = await ApplicationSettings.create({});
  }

  if (type === 'paybill') {
    settings.mpesaPaybill = { ...settings.mpesaPaybill, ...data };
  } else if (type === 'till') {
    settings.mpesaTill = { ...settings.mpesaTill, ...data };
  } else {
    res.status(400);
    throw new Error('Invalid settings type specified');
  }

  const updatedSettings = await settings.save();
  res.json(updatedSettings);
});

// @desc    Activate M-Pesa callback URL
// @route   POST /api/settings/mpesa/activate
// @access  Private/Admin
const activateMpesa = asyncHandler(async (req, res) => {
  const { type } = req.body; // type can be 'paybill' or 'till'
  if (!type) {
    res.status(400);
    throw new Error('M-Pesa type (paybill or till) is required.');
  }

  try {
    const response = await registerCallbackURL(type);
    res.json({ message: 'M-Pesa callback URL registered successfully.', response });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to register M-Pesa callback URL. ${error.message}`);
  }
});


module.exports = {
  getBrandingSettings,
  updateBrandingSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
};