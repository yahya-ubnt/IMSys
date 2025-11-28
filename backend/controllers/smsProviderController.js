const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsProvider = require('../models/SmsProvider');

// @desc    Get all SMS providers
// @route   GET /api/settings/sms-providers
// @access  Private (Admin)
const getSmsProviders = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const providers = await SmsProvider.find(query).sort({ createdAt: -1 });
  // We don't send credentials back to the client
  const sanitizedProviders = providers.map(p => {
    const provider = p.toObject({ getters: false }); // get plain object without getters
    delete provider.credentials;
    return provider;
  });
  res.json(sanitizedProviders);
});

// @desc    Get a single SMS provider
// @route   GET /api/settings/sms-providers/:id
// @access  Private (Admin)
const getSmsProviderById = asyncHandler(async (req, res) => {
    const query = { _id: req.params.id, tenant: req.user.tenant };

    const provider = await SmsProvider.findOne(query);

    if (provider) {
        const sanitizedProvider = provider.toObject({ getters: false });
        delete sanitizedProvider.credentials;
        res.json(sanitizedProvider);
    } else {
        res.status(404);
        throw new Error('SMS provider not found');
    }
});


// @desc    Create a new SMS provider
// @route   POST /api/settings/sms-providers
// @access  Private (Admin)
const createSmsProvider = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, providerType, credentials, isActive } = req.body;

  const provider = new SmsProvider({
    name,
    providerType,
    credentials, // The setter in the model will encrypt this
    isActive,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
  });

  const createdProvider = await provider.save();
  const sanitizedProvider = createdProvider.toObject({ getters: false });
  delete sanitizedProvider.credentials;

  res.status(201).json(sanitizedProvider);
});

// @desc    Update an SMS provider
// @route   PUT /api/settings/sms-providers/:id
// @access  Private (Admin)
const updateSmsProvider = asyncHandler(async (req, res) => {
  const { name, providerType, credentials, isActive } = req.body;
  const provider = await SmsProvider.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (provider) {
    provider.name = name || provider.name;
    provider.providerType = providerType || provider.providerType;
    if (credentials && Object.keys(credentials).length > 0) {
        // The model's 'get' function decrypts the existing credentials.
        // We need to merge the new credentials with the old ones if not all fields are provided.
        const existingCredentials = provider.get('credentials', null, { getters: true });
        provider.credentials = { ...existingCredentials, ...credentials };
    }
    provider.isActive = isActive === undefined ? provider.isActive : isActive;

    const updatedProvider = await provider.save();
    const sanitizedProvider = updatedProvider.toObject({ getters: false });
    delete sanitizedProvider.credentials;
    
    res.json(sanitizedProvider);
  } else {
    res.status(404);
    throw new Error('SMS provider not found');
  }
});

// @desc    Delete an SMS provider
// @route   DELETE /api/settings/sms-providers/:id
// @access  Private (Admin)
const deleteSmsProvider = asyncHandler(async (req, res) => {
  const provider = await SmsProvider.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (provider) {
    await provider.deleteOne();
    res.json({ message: 'SMS provider removed' });
  } else {
    res.status(404);
    throw new Error('SMS provider not found');
  }
});

// @desc    Set a provider to active
// @route   POST /api/settings/sms-providers/:id/set-active
// @access  Private (Admin)
const setActiveSmsProvider = asyncHandler(async (req, res) => {
    const provider = await SmsProvider.findOne({ _id: req.params.id, tenant: req.user.tenant });

    if (provider) {
        provider.isActive = true;
        await provider.save(); // The pre-save hook will handle deactivating others
        res.json({ message: `${provider.name} has been set as the active SMS provider.` });
    } else {
        res.status(404);
        throw new Error('SMS provider not found');
    }
});


module.exports = {
  getSmsProviders,
  getSmsProviderById,
  createSmsProvider,
  updateSmsProvider,
  deleteSmsProvider,
  setActiveSmsProvider,
};