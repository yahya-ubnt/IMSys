const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const ApplicationSettings = require('../models/ApplicationSettings');
const { registerCallbackURL } = require('../services/mpesaService');
const { encrypt } = require('../utils/crypto'); // Import encrypt


// @desc    Get application general settings
// @route   GET /api/settings/general
// @access  Private
const getGeneralSettings = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  let settings = await ApplicationSettings.findOne(query).select('-smtpSettings.pass'); // Exclude encrypted pass
  
  if (!settings) {
    console.log('No settings found, creating default ones for tenant:', req.user.tenant);
    // If no settings exist for this user, create default ones
    try {
      settings = await ApplicationSettings.create({ 
        tenant: req.user.tenant,
        appName: "MEDIATEK",
        paymentGracePeriodDays: 3,
        currencySymbol: "KES",
        taxRate: 0,
        autoDisconnectUsers: true,
        sendPaymentReminders: true,
      });
      console.log('Default settings created:', settings);
    } catch (error) {
      console.error('Error creating default settings for tenant:', req.user.tenant, error);
      res.status(500).json({ message: 'Error creating default settings', error: error.message });
      return;
    }
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

  let settings = await ApplicationSettings.findOne({ tenant: req.user.tenant });
  if (!settings) {
    settings = await ApplicationSettings.create({ tenant: req.user.tenant });
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

  // Handle admin notification emails
  if (req.body.adminNotificationEmails && Array.isArray(req.body.adminNotificationEmails)) {
    settings.adminNotificationEmails = req.body.adminNotificationEmails;
  }

  // Handle SMTP settings
  if (req.body.smtpSettings) {
    const { pass, ...otherSmtpSettings } = req.body.smtpSettings;
    settings.smtpSettings = { ...settings.smtpSettings, ...otherSmtpSettings };
    if (pass) { // Only update password if a new one is provided
      settings.smtpSettings.pass = encrypt(pass);
    }
  }

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
  const query = { tenant: req.user.tenant };

  const settings = await ApplicationSettings.findOne(query).select('+mpesaPaybill.consumerKey +mpesaPaybill.consumerSecret +mpesaPaybill.passkey +mpesaTill.consumerKey +mpesaTill.consumerSecret +mpesaTill.passkey');
  
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

  let settings = await ApplicationSettings.findOne({ tenant: req.user.tenant });
  if (!settings) {
    settings = await ApplicationSettings.create({ tenant: req.user.tenant });
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

  console.log(`[${new Date().toISOString()}] M-Pesa settings updated successfully for tenant ${req.user.tenant}`);

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

  try {
    const response = await registerCallbackURL(req.user.tenant); // Pass tenant ID
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