const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsTemplate = require('../models/SmsTemplate');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Get all SMS acknowledgement mappings
// @route   GET /api/smsacknowledgements
// @access  Private
const getAcknowledgements = asyncHandler(async (req, res) => {
  const acknowledgements = await SmsAcknowledgement.find({ tenantOwner: req.user.tenantOwner }).populate('smsTemplate', 'name messageBody');
  res.json(acknowledgements);
});

// @desc    Get single SMS acknowledgement mapping by ID
// @route   GET /api/smsacknowledgements/:id
// @access  Private
const getAcknowledgementById = asyncHandler(async (req, res) => {
  const acknowledgement = await SmsAcknowledgement.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner }).populate('smsTemplate', 'name messageBody');

  if (acknowledgement) {
    res.json(acknowledgement);
  } else {
    res.status(404);
    throw new Error('SMS Acknowledgement mapping not found');
  }
});

// @desc    Create a new SMS acknowledgement mapping
// @route   POST /api/smsacknowledgements
// @access  Private
const createAcknowledgement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { triggerType, description, smsTemplate, status } = req.body;

  // Verify ownership of smsTemplate
  const template = await SmsTemplate.findOne({ _id: smsTemplate, tenantOwner: req.user.tenantOwner });
  if (!template) {
    res.status(401);
    throw new Error('Not authorized to use this SMS template');
  }

  const mappingExists = await SmsAcknowledgement.findOne({ triggerType, tenantOwner: req.user.tenantOwner });

  if (mappingExists) {
    res.status(400);
    throw new Error('A mapping for this trigger type already exists');
  }

  const acknowledgement = await SmsAcknowledgement.create({
    triggerType,
    description: sanitizeString(description), // Sanitize description
    smsTemplate,
    status,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  if (acknowledgement) {
    res.status(201).json(acknowledgement);
  } else {
    res.status(400);
    throw new Error('Invalid acknowledgement mapping data');
  }
});

// @desc    Update an SMS acknowledgement mapping
// @route   PUT /api/smsacknowledgements/:id
// @access  Private
const updateAcknowledgement = asyncHandler(async (req, res) => {
  const { triggerType, description, smsTemplate, status } = req.body;

  const acknowledgement = await SmsAcknowledgement.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (acknowledgement) {
    acknowledgement.triggerType = triggerType || acknowledgement.triggerType;
    acknowledgement.description = description ? sanitizeString(description) : acknowledgement.description;
    acknowledgement.smsTemplate = smsTemplate || acknowledgement.smsTemplate;
    acknowledgement.status = status || acknowledgement.status;

    const updatedAcknowledgement = await acknowledgement.save();
    res.json(updatedAcknowledgement);
  } else {
    res.status(404);
    throw new Error('Acknowledgement mapping not found');
  }
});

// @desc    Delete an SMS acknowledgement mapping
// @route   DELETE /api/smsacknowledgements/:id
// @access  Private
const deleteAcknowledgement = asyncHandler(async (req, res) => {
  const acknowledgement = await SmsAcknowledgement.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (acknowledgement) {
    await acknowledgement.deleteOne();
    res.json({ message: 'SMS Acknowledgement mapping removed' });
  } else {
    res.status(404);
    throw new Error('Acknowledgement mapping not found');
  }
});

module.exports = {
  getAcknowledgements,
  getAcknowledgementById,
  createAcknowledgement,
  updateAcknowledgement,
  deleteAcknowledgement,
};
