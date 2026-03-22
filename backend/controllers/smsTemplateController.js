const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsTemplate = require('../models/SmsTemplate');
const smsTriggers = require('../constants/smsTriggers'); // Import smsTriggers

// @desc    Get all SMS templates
// @route   GET /api/smstemplates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const query = { tenant: req.user.tenant };

  const templates = await SmsTemplate.find(query);
  res.json(templates);
});

// @desc    Get available SMS triggers and their variables
// @route   GET /api/smstemplates/triggers
// @access  Private
const getSmsTriggersWithVariables = asyncHandler(async (req, res) => {
  // Convert the object to an array of triggers for easier consumption by frontend
  const triggersArray = Object.keys(smsTriggers).map(key => smsTriggers[key]);
  res.json(triggersArray);
});

// @desc    Get single SMS template by ID
// @route   GET /api/smstemplates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };

  const template = await SmsTemplate.findOne(query);

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

  const { triggerType, messageBody, status } = req.body;

  const templateExists = await SmsTemplate.findOne({ triggerType, tenant: req.user.tenant });

  if (templateExists) {
    res.status(400);
    throw new Error('A template for this trigger type already exists');
  }

  const template = await SmsTemplate.create({
    triggerType,
    messageBody,
    status,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
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
  const { messageBody, status } = req.body;

  const template = await SmsTemplate.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (template) {
    template.messageBody = messageBody || template.messageBody;
    template.status = status || template.status;

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
  const template = await SmsTemplate.findOne({ _id: req.params.id, tenant: req.user.tenant });

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
  getSmsTriggersWithVariables,
};