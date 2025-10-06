const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsTemplate = require('../models/SmsTemplate');

// @desc    Get all SMS templates
// @route   GET /api/smstemplates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await SmsTemplate.find({ user: req.user._id });
  res.json(templates);
});

// @desc    Get single SMS template by ID
// @route   GET /api/smstemplates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await SmsTemplate.findById(req.params.id);

  if (template) {
    // Check for ownership
    if (template.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this template');
    }
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

  const templateExists = await SmsTemplate.findOne({ name, user: req.user._id });

  if (templateExists) {
    res.status(400);
    throw new Error('A template with this name already exists');
  }

  const template = await SmsTemplate.create({
    name,
    messageBody,
    user: req.user._id, // Associate with the logged-in user
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
    // Check for ownership
    if (template.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this template');
    }

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
    // Check for ownership
    if (template.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this template');
    }

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
