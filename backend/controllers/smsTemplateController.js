const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsTemplate = require('../models/SmsTemplate');

// @desc    Get all SMS templates
// @route   GET /api/smstemplates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await SmsTemplate.find({ tenantOwner: req.user.tenantOwner });
  res.json(templates);
});

// @desc    Get single SMS template by ID
// @route   GET /api/smstemplates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await SmsTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (template) {
    res.json(template);
  } else {
    res.status(404);
    throw new Error('SMS Template not found');
  }
});

// @desc    Create a new SMS template
// @route   POST /api/smstemplates
// @access  Private
const createTemplate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, messageBody } = req.body;

  const templateExists = await SmsTemplate.findOne({ name, tenantOwner: req.user.tenantOwner });

  if (templateExists) {
    res.status(400);
    throw new Error('A template with this name already exists');
  }

  const template = await SmsTemplate.create({
    name,
    messageBody,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  if (template) {
    res.status(201).json(template);
  } else {
    res.status(400);
    throw new Error('Invalid SMS template data');
  }
});

// @desc    Update an SMS template
// @route   PUT /api/smstemplates/:id
// @access  Private
const updateTemplate = asyncHandler(async (req, res) => {
  const { name, messageBody } = req.body;

  const template = await SmsTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (template) {
    template.name = name || template.name;
    template.messageBody = messageBody || template.messageBody;

    const updatedTemplate = await template.save();
    res.json(updatedTemplate);
  } else {
    res.status(404);
    throw new Error('SMS Template not found');
  }
});

// @desc    Delete an SMS template
// @route   DELETE /api/smstemplates/:id
// @access  Private
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await SmsTemplate.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (template) {
    await template.deleteOne();
    res.json({ message: 'SMS Template removed' });
  } else {
    res.status(404);
    throw new Error('SMS Template not found');
  }
});

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
