const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');

// @desc    Get all SMS expiry schedules
// @route   GET /api/smsexpiryschedules
// @access  Private
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await SmsExpirySchedule.find({ user: req.user._id }).sort({ createdAt: 'desc' });
  res.json(schedules);
});

// @desc    Get single SMS expiry schedule by ID
// @route   GET /api/smsexpiryschedules/:id
// @access  Private
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await SmsExpirySchedule.findById(req.params.id);

  if (schedule) {
    // Check for ownership
    if (schedule.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this schedule');
    }
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
  const smsTpl = await SmsTemplate.findById(smsTemplate);
  if (!smsTpl || smsTpl.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to use this SMS template');
  }

  // Verify ownership of whatsAppTemplate if provided
  if (whatsAppTemplate) {
    const waTpl = await WhatsAppTemplate.findById(whatsAppTemplate);
    if (!waTpl || waTpl.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to use this WhatsApp template');
    }
  }

  const scheduleExists = await SmsExpirySchedule.findOne({ name, user: req.user._id });

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
    user: req.user._id, // Associate with the logged-in user
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
  const { name, days, timing, messageBody, status } = req.body;

  const schedule = await SmsExpirySchedule.findById(req.params.id);

  if (schedule) {
    // Check for ownership
    if (schedule.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this schedule');
    }

    schedule.name = name || schedule.name;
    schedule.days = days || schedule.days;
    schedule.timing = timing || schedule.timing;
    schedule.messageBody = messageBody || schedule.messageBody;
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
  const schedule = await SmsExpirySchedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Schedule not found');
  }

  // Check for ownership
  if (schedule.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this schedule');
  }
  await schedule.remove();
  res.json({ message: 'SMS Expiry Schedule removed' });
});

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
