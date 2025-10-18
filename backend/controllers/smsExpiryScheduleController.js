const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const SmsTemplate = require('../models/SmsTemplate');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Get all SMS expiry schedules
// @route   GET /api/smsexpiryschedules
// @access  Private
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await SmsExpirySchedule.find({ tenantOwner: req.user.tenantOwner }).sort({ createdAt: 'desc' });
  res.json(schedules);
});

// @desc    Get single SMS expiry schedule by ID
// @route   GET /api/smsexpiryschedules/:id
// @access  Private
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await SmsExpirySchedule.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (schedule) {
    res.json(schedule);
  } else {
    res.status(404);
    throw new Error('SMS Expiry Schedule not found');
  }
});

// @desc    Create a new SMS expiry schedule
// @route   POST /api/smsexpiryschedules
// @access  Private
const createSchedule = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, days, timing, smsTemplate, whatsAppTemplate, status } = req.body;

  // Verify ownership of smsTemplate
  const smsTpl = await SmsTemplate.findOne({ _id: smsTemplate, tenantOwner: req.user.tenantOwner });
  if (!smsTpl) {
    res.status(401);
    throw new Error('Not authorized to use this SMS template');
  }

  // Verify ownership of whatsAppTemplate if provided
  if (whatsAppTemplate) {
    const waTpl = await WhatsAppTemplate.findOne({ _id: whatsAppTemplate, tenantOwner: req.user.tenantOwner });
    if (!waTpl) {
      res.status(401);
      throw new Error('Not authorized to use this WhatsApp template');
    }
  }

  const scheduleExists = await SmsExpirySchedule.findOne({ name, tenantOwner: req.user.tenantOwner });

  if (scheduleExists) {
    res.status(400);
    throw new Error('A schedule with this name already exists');
  }

  const schedule = await SmsExpirySchedule.create({
    name,
    days,
    timing,
    smsTemplate,
    whatsAppTemplate,
    status,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  if (schedule) {
    res.status(201).json(schedule);
  } else {
    res.status(400);
    throw new Error('Invalid schedule data');
  }
});

// @desc    Update an SMS expiry schedule
// @route   PUT /api/smsexpiryschedules/:id
// @access  Private
const updateSchedule = asyncHandler(async (req, res) => {
  const { name, days, timing, smsTemplate, whatsAppTemplate, status } = req.body;

  const schedule = await SmsExpirySchedule.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (schedule) {
    schedule.name = name || schedule.name;
    schedule.days = days || schedule.days;
    schedule.timing = timing || schedule.timing;
    schedule.smsTemplate = smsTemplate || schedule.smsTemplate;
    schedule.whatsAppTemplate = whatsAppTemplate || schedule.whatsAppTemplate;
    schedule.status = status || schedule.status;

    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } else {
    res.status(404);
    throw new Error('Schedule not found');
  }
});

// @desc    Delete an SMS expiry schedule
// @route   DELETE /api/smsexpiryschedules/:id
// @access  Private
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await SmsExpirySchedule.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  await schedule.deleteOne();
  res.json({ message: 'SMS Expiry Schedule removed' });
});

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
