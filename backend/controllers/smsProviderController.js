const asyncHandler = require('express-async-handler');
const SmsProvider = require('../models/SmsProvider');

// @desc    Get all SMS providers
// @route   GET /api/settings/sms-providers
// @access  Private (Admin)
const getSmsProviders = asyncHandler(async (req, res) => {
  const providers = await SmsProvider.find({}).sort({ createdAt: -1 });
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
    const provider = await SmsProvider.findById(req.params.id);

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
  const { name, providerType, credentials, isActive } = req.body;

  if (!name || !providerType || !credentials) {
    res.status(400);
    throw new Error('Please provide name, providerType, and credentials');
  }

  const provider = new SmsProvider({
    name,
    providerType,
    credentials, // The setter in the model will encrypt this
    isActive,
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
  const provider = await SmsProvider.findById(req.params.id);

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
  const provider = await SmsProvider.findById(req.params.id);

  if (provider) {
    await provider.remove();
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
    const provider = await SmsProvider.findById(req.params.id);

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