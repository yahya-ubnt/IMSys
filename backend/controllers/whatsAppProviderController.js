const asyncHandler = require('express-async-handler');
const WhatsAppProvider = require('../models/WhatsAppProvider');

// @desc    Get all WhatsApp providers
// @route   GET /api/settings/whatsapp-providers
// @access  Private (Admin)
const getWhatsAppProviders = asyncHandler(async (req, res) => {
  const providers = await WhatsAppProvider.find({}).sort({ createdAt: -1 });
  const sanitizedProviders = providers.map(p => {
    const provider = p.toObject({ getters: false });
    delete provider.credentials;
    return provider;
  });
  res.json(sanitizedProviders);
});

// @desc    Create a new WhatsApp provider
// @route   POST /api/settings/whatsapp-providers
// @access  Private (Admin)
const createWhatsAppProvider = asyncHandler(async (req, res) => {
  const { name, providerType, credentials, isActive } = req.body;

  if (!name || !providerType || !credentials) {
    res.status(400);
    throw new Error('Please provide name, providerType, and credentials');
  }

  const provider = new WhatsAppProvider({
    name,
    providerType,
    credentials,
    isActive,
  });

  const createdProvider = await provider.save();
  const sanitizedProvider = createdProvider.toObject({ getters: false });
  delete sanitizedProvider.credentials;

  res.status(201).json(sanitizedProvider);
});

// @desc    Update a WhatsApp provider
// @route   PUT /api/settings/whatsapp-providers/:id
// @access  Private (Admin)
const updateWhatsAppProvider = asyncHandler(async (req, res) => {
  const { name, providerType, credentials, isActive } = req.body;
  const provider = await WhatsAppProvider.findById(req.params.id);

  if (provider) {
    provider.name = name || provider.name;
    provider.providerType = providerType || provider.providerType;
    if (credentials && Object.keys(credentials).length > 0) {
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
    throw new Error('WhatsApp provider not found');
  }
});

// @desc    Delete a WhatsApp provider
// @route   DELETE /api/settings/whatsapp-providers/:id
// @access  Private (Admin)
const deleteWhatsAppProvider = asyncHandler(async (req, res) => {
  const provider = await WhatsAppProvider.findById(req.params.id);

  if (provider) {
    await provider.remove();
    res.json({ message: 'WhatsApp provider removed' });
  } else {
    res.status(404);
    throw new Error('WhatsApp provider not found');
  }
});

// @desc    Set a provider to active
// @route   POST /api/settings/whatsapp-providers/:id/set-active
// @access  Private (Admin)
const setActiveWhatsAppProvider = asyncHandler(async (req, res) => {
    const provider = await WhatsAppProvider.findById(req.params.id);

    if (provider) {
        provider.isActive = true;
        await provider.save();
        res.json({ message: `${provider.name} has been set as the active WhatsApp provider.` });
    } else {
        res.status(404);
        throw new Error('WhatsApp provider not found');
    }
});

module.exports = {
  getWhatsAppProviders,
  createWhatsAppProvider,
  updateWhatsAppProvider,
  deleteWhatsAppProvider,
  setActiveWhatsAppProvider,
};