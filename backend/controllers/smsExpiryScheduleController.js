const asyncHandler = require('express-async-handler');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');

// @desc    Get all SMS expiry schedules
// @route   GET /api/smsexpiryschedules
// @access  Private
const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await SmsExpirySchedule.find({});
  res.json(schedules);
});

// @desc    Get single SMS expiry schedule by ID
// @route   GET /api/smsexpiryschedules/:id
// @access  Private
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await SmsExpirySchedule.findById(req.params.id);

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
  const { name, days, timing, messageBody, status } = req.body;

  if (!name || !days || !timing || !messageBody) {
    res.status(400);
    throw new Error('Please provide name, days, timing, and messageBody');
  }

  const scheduleExists = await SmsExpirySchedule.findOne({ name });

  if (scheduleExists) {
    res.status(400);
    throw new Error('A schedule with this name already exists');
  }

  const schedule = await SmsExpirySchedule.create({
    name,
    days,
    timing,
    messageBody,
    status,
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

  if (schedule) {
    await schedule.remove();
    res.json({ message: 'SMS Expiry Schedule removed' });
  } else {
    res.status(404);
    throw new Error('Schedule not found');
  }
});

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
