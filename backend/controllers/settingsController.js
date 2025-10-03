const asyncHandler = require('express-async-handler');
const ApplicationSettings = require('../models/ApplicationSettings');
const { registerCallbackURL } = require('../services/mpesaService');


// @desc    Get application general settings
// @route   GET /api/settings/general
// @access  Private
const getGeneralSettings = asyncHandler(async (req, res) => {
  const settings = await ApplicationSettings.findOne();

  if (settings) {
    res.json(settings);
  } else {
    // If no settings exist, create default ones
    const defaultSettings = await ApplicationSettings.create({});
    res.json(defaultSettings);
  }
});

// @desc    Update application general settings
// @route   PUT /api/settings/general
// @access  Private/Admin
const updateGeneralSettings = asyncHandler(async (req, res) => {
  const { appName, logoIcon, favicon, paymentGracePeriodDays, currencySymbol, taxRate, autoDisconnectUsers, sendPaymentReminders, disconnectTime, companyInfo, portalUrls } = req.body;

  let settings = await ApplicationSettings.findOne();

  if (!settings) {
    settings = await ApplicationSettings.create({});
  }

  settings.appName = appName || settings.appName;
  settings.paymentGracePeriodDays = paymentGracePeriodDays || settings.paymentGracePeriodDays;
  settings.currencySymbol = currencySymbol || settings.currencySymbol;
  settings.taxRate = taxRate || settings.taxRate;
  settings.autoDisconnectUsers = autoDisconnectUsers !== undefined ? autoDisconnectUsers : settings.autoDisconnectUsers;
  settings.sendPaymentReminders = sendPaymentReminders !== undefined ? sendPaymentReminders : settings.sendPaymentReminders;
  settings.disconnectTime = disconnectTime || settings.disconnectTime;
  settings.companyInfo = companyInfo ? { ...settings.companyInfo, ...companyInfo } : settings.companyInfo;
  settings.portalUrls = portalUrls ? { ...settings.portalUrls, ...portalUrls } : settings.portalUrls;

  // Handle file uploads
  if (req.files) {
    if (req.files.logoIcon) {
      settings.logoIcon = `/${req.files.logoIcon[0].path}`;
    }
    if (req.files.favicon) {
      settings.favicon = `/${req.files.favicon[0].path}`;
    }
  }

  const updatedSettings = await settings.save();
  res.json(updatedSettings);
});

// @desc    Get M-Pesa settings
// @route   GET /api/settings/mpesa
// @access  Private/Admin
const getMpesaSettings = asyncHandler(async (req, res) => {
  const settings = await ApplicationSettings.findOne().select('+mpesaPaybill.consumerKey +mpesaPaybill.consumerSecret +mpesaPaybill.passkey +mpesaTill.consumerKey +mpesaTill.consumerSecret +mpesaTill.passkey');
  
  if (settings) {
    res.json({
      mpesaPaybill: settings.mpesaPaybill,
      mpesaTill: settings.mpesaTill,
    });
  } else {
    // If no settings exist, return empty objects
    res.json({
      mpesaPaybill: {},
      mpesaTill: {},
    });
  }
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
  getGeneralSettings,
  updateGeneralSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
};