const asyncHandler = require('express-async-handler');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');

// @desc    Get all SMS acknowledgement mappings
// @route   GET /api/smsacknowledgements
// @access  Private
const getAcknowledgements = asyncHandler(async (req, res) => {
  const acknowledgements = await SmsAcknowledgement.find({}).populate('smsTemplate', 'name messageBody');
  res.json(acknowledgements);
});

// @desc    Get single SMS acknowledgement mapping by ID
// @route   GET /api/smsacknowledgements/:id
// @access  Private
const getAcknowledgementById = asyncHandler(async (req, res) => {
  const acknowledgement = await SmsAcknowledgement.findById(req.params.id).populate('smsTemplate', 'name messageBody');

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
  const { triggerType, description, smsTemplate, status } = req.body;

  if (!triggerType || !smsTemplate) {
    res.status(400);
    throw new Error('Please provide a triggerType and an smsTemplate');
  }

  const mappingExists = await SmsAcknowledgement.findOne({ triggerType });

  if (mappingExists) {
    res.status(400);
    throw new Error('A mapping for this trigger type already exists');
  }

  const acknowledgement = await SmsAcknowledgement.create({
    triggerType,
    description,
    smsTemplate,
    status,
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

  const acknowledgement = await SmsAcknowledgement.findById(req.params.id);

  if (acknowledgement) {
    acknowledgement.triggerType = triggerType || acknowledgement.triggerType;
    acknowledgement.description = description || acknowledgement.description;
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
  const acknowledgement = await SmsAcknowledgement.findById(req.params.id);

  if (acknowledgement) {
    await acknowledgement.remove();
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
