const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const ApplicationSettings = require('../models/ApplicationSettings');
const { registerCallbackURL } = require('../services/mpesaService');


// @desc    Get application general settings
// @route   GET /api/settings/general
// @access  Private
const getGeneralSettings = asyncHandler(async (req, res) => {
  let settings = await ApplicationSettings.findOne({ user: req.user._id });

  if (!settings) {
    // If no settings exist for this user, create default ones
    settings = await ApplicationSettings.create({ user: req.user._id });
  }
  res.json(settings);
});

// @desc    Update application general settings
// @route   PUT /api/settings/general
// @access  Private/Admin
const updateGeneralSettings = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let settings = await ApplicationSettings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await ApplicationSettings.create({ user: req.user._id });
  }

  // List of fields that can be updated
  const fieldsToUpdate = [
    'appName', 'slogan', 'paymentGracePeriodDays', 'currencySymbol', 
    'taxRate', 'autoDisconnectUsers', 'sendPaymentReminders', 'disconnectTime'
  ];

  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  // Handle nested objects separately
  if (req.body.companyInfo) {
    let companyInfo = req.body.companyInfo;
    if (typeof companyInfo === 'string') {
      companyInfo = JSON.parse(companyInfo);
    }
    settings.companyInfo = { ...settings.companyInfo, ...companyInfo };
  }

  if (req.body.portalUrls) {
    let portalUrls = req.body.portalUrls;
    if (typeof portalUrls === 'string') {
      portalUrls = JSON.parse(portalUrls);
    }
    settings.portalUrls = { ...settings.portalUrls, ...portalUrls };
  }

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
  const settings = await ApplicationSettings.findOne({ user: req.user._id }).select('+mpesaPaybill.consumerKey +mpesaPaybill.consumerSecret +mpesaPaybill.passkey +mpesaTill.consumerKey +mpesaTill.consumerSecret +mpesaTill.passkey');
  
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, data } = req.body; // type can be 'paybill' or 'till'

  let settings = await ApplicationSettings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await ApplicationSettings.create({ user: req.user._id });
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type } = req.body; // type can be 'paybill' or 'till'
  if (!type) {
    res.status(400);
    throw new Error('M-Pesa type (paybill or till) is required.');
  }

  try {
    const response = await registerCallbackURL(type, req.user._id); // Pass userId
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