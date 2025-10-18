const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

// @desc    Get all WhatsApp templates
// @route   GET /api/whatsapp-templates
// @access  Private (Admin)
const getWhatsAppTemplates = asyncHandler(async (req, res) => {
  const templates = await WhatsAppTemplate.find({ tenantOwner: req.user.tenantOwner }).sort({ createdAt: -1 });
  res.json(templates);
});

// @desc    Create a new WhatsApp template
// @route   POST /api/whatsapp-templates
// @access  Private (Admin)
const createWhatsAppTemplate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { templateName, providerTemplateId, body, variables } = req.body;

  const template = new WhatsAppTemplate({
    templateName,
    providerTemplateId,
    body,
    variables,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  const createdTemplate = await template.save();
  res.status(201).json(createdTemplate);
});

// @desc    Get a single WhatsApp template by ID
// @route   GET /api/whatsapp-templates/:id
// @access  Private (Admin)
const getWhatsAppTemplateById = asyncHandler(async (req, res) => {
    const template = await WhatsAppTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });
    if (template) {
        res.json(template);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Update a WhatsApp template
// @route   PUT /api/whatsapp-templates/:id
// @access  Private (Admin)
const updateWhatsAppTemplate = asyncHandler(async (req, res) => {
  const { templateName, providerTemplateId, body, variables } = req.body;
  const template = await WhatsAppTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (template) {
    template.templateName = templateName || template.templateName;
    template.providerTemplateId = providerTemplateId || template.providerTemplateId;
    template.body = body || template.body;
    template.variables = variables || template.variables;

    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } else {
    res.status(404);
    throw new Error('Template not found');
  }
});

// @desc    Delete a WhatsApp template
// @route   DELETE /api/whatsapp-templates/:id
// @access  Private (Admin)
const deleteWhatsAppTemplate = asyncHandler(async (req, res) => {
  const template = await WhatsAppTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (template) {
    await template.deleteOne();
    res.json({ message: 'WhatsApp template removed' });
  } else {
    res.status(404);
    throw new Error('Template not found');
  }
});

module.exports = {
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  getWhatsAppTemplateById,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
};