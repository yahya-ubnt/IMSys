const asyncHandler = require('express-async-handler');
const SmsTemplate = require('../models/SmsTemplate');

// @desc    Get all SMS templates
// @route   GET /api/smstemplates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await SmsTemplate.find({});
  res.json(templates);
});

// @desc    Get single SMS template by ID
// @route   GET /api/smstemplates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await SmsTemplate.findById(req.params.id);

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
  const { name, messageBody } = req.body;

  if (!name || !messageBody) {
    res.status(400);
    throw new Error('Please provide a name and message body for the template');
  }

  const templateExists = await SmsTemplate.findOne({ name });

  if (templateExists) {
    res.status(400);
    throw new Error('A template with this name already exists');
  }

  const template = await SmsTemplate.create({
    name,
    messageBody,
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

  const template = await SmsTemplate.findById(req.params.id);

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
  const template = await SmsTemplate.findById(req.params.id);

  if (template) {
    await template.remove();
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
