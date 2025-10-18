const asyncHandler = require('express-async-handler');
const SmsLog = require('../models/SmsLog');
const User = require('../models/User'); // Assuming User model has phoneNumber
const MikrotikUser = require('../models/MikrotikUser'); // Assuming MikrotikUser model
const { sendSMS } = require('../services/smsService');
const smsTriggers = require('../constants/smsTriggers');

// @desc    Get available SMS trigger types
// @route   GET /api/sms/triggers
// @access  Private
const getSmsTriggers = asyncHandler(async (req, res) => {
  const triggerArray = Object.entries(smsTriggers).map(([key, value]) => {
    const name = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return { id: value, name: name };
  });
  res.json(triggerArray);
});

// @desc    Compose and send a new SMS
// @route   POST /api/sms/compose
// @access  Private
const composeAndSendSms = asyncHandler(async (req, res) => {
  const {
    message,
    sendToType, // 'users', 'mikrotikGroup', 'location', 'unregistered'
    userIds,
    mikrotikRouterId,
    apartment_house_number,
    unregisteredMobileNumber,
  } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message body is required');
  }

  let recipientPhoneNumbers = [];
  let messageType = 'Compose New Message'; // Default type

  switch (sendToType) {
    case 'users':
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400);
        throw new Error('User IDs are required for sending to users');
      }
      const users = await User.find({ _id: { $in: userIds }, user: req.user._id }).select('phoneNumber');
      recipientPhoneNumbers = users.map(user => user.phoneNumber).filter(Boolean);
      break;

    case 'mikrotikGroup':
      if (!mikrotikRouterId) {
        res.status(400);
        throw new Error('Mikrotik Router ID is required for sending to Mikrotik group');
      }
      // Assuming MikrotikUser model has a reference to MikrotikRouter and a phoneNumber
      const mikrotikUsers = await MikrotikUser.find({ mikrotikRouter: mikrotikRouterId, user: req.user._id }).select('phoneNumber');
      recipientPhoneNumbers = mikrotikUsers.map(user => user.phoneNumber).filter(Boolean);
      break;

    case 'location':
      if (!apartment_house_number) {
        res.status(400);
        throw new Error('Apartment/House Number is required for sending to location');
      }
      const usersInLocation = await MikrotikUser.find({ apartment_house_number: apartment_house_number, user: req.user._id }).select('mobileNumber');
      recipientPhoneNumbers = usersInLocation.map(user => user.mobileNumber).filter(Boolean);
      break;

    case 'unregistered':
      if (!unregisteredMobileNumber) {
        res.status(400);
        throw new Error('Mobile number is required for sending to unregistered users');
      }
      recipientPhoneNumbers.push(unregisteredMobileNumber);
      break;

    default:
      res.status(400);
      throw new Error('Invalid sendToType specified');
  }

  if (recipientPhoneNumbers.length === 0) {
    res.status(400);
    throw new Error('No valid recipient phone numbers found for the selected criteria.');
  }

  const sentLogs = [];
  for (const phoneNumber of recipientPhoneNumbers) {
    // Log the SMS to the database with a 'Pending' status initially
    const log = await SmsLog.create({
      mobileNumber: phoneNumber,
      message: message,
      messageType: messageType,
      smsStatus: 'Pending',
      user: req.user._id, // Associate with the logged-in user
    });

    try {
      const gatewayResponse = await sendSMS(req.user._id, phoneNumber, message);

      // Update the log with the gateway's response
      log.smsStatus = gatewayResponse.success ? 'Success' : 'Failed';
      log.providerResponse = gatewayResponse.message; // Store the message from gateway response
      await log.save();
      sentLogs.push(log);

    } catch (error) {
      // If sending fails, update the log to 'Failed'
      log.smsStatus = 'Failed';
      log.providerResponse = { error: error.message };
      await log.save();
      sentLogs.push(log);
      console.error(`Failed to send SMS to ${phoneNumber}: ${error.message}`);
    }
  }

  res.status(200).json({ message: 'SMS sending process initiated.', logs: sentLogs });
});

// @desc    Get sent SMS log with filtering and pagination
// @route   GET /api/sms/log
// @access  Private
const getSentSmsLog = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 25;
  const page = Number(req.query.page) || 1;

  const query = { user: req.user._id }; // Filter by user

  if (req.query.mobileNumber) {
    query.mobileNumber = { $regex: req.query.mobileNumber, $options: 'i' };
  }

  if (req.query.messageType) {
    query.messageType = req.query.messageType;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const count = await SmsLog.countDocuments(query);
  const logs = await SmsLog.find(query)
    .populate('user', 'fullName email')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    logs,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

const { json2csv } = require('json-2-csv');

// @desc    Export SMS logs to CSV
// @route   GET /api/sms/log/export
// @access  Private
const exportSmsLogs = asyncHandler(async (req, res) => {
  const query = { user: req.user._id }; // Filter by user

  if (req.query.mobileNumber) {
    query.mobileNumber = { $regex: req.query.mobileNumber, $options: 'i' };
  }

  if (req.query.messageType) {
    query.messageType = req.query.messageType;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const logs = await SmsLog.find(query).populate('user', 'fullName email').sort({ createdAt: -1 });

  const fields = [
    { label: 'ID', value: '_id' },
    { label: 'Mobile Number', value: 'mobileNumber' },
    { label: 'Message', value: 'message' },
    { label: 'Message Type', value: 'messageType' },
    { label: 'SMS Status', value: 'smsStatus' },
    { label: 'Sent By', value: 'user.fullName' }, // Assuming user.fullName exists
    { label: 'Date & Time', value: 'createdAt' },
  ];

  const csv = await json2csv(logs, { fields });

  res.header('Content-Type', 'text/csv');
  res.attachment('sms_logs.csv');
  res.send(csv);
});

module.exports = {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
};