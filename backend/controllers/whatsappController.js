const asyncHandler = require('express-async-handler');
const WhatsAppLog = require('../models/WhatsAppLog');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');
const Unit = require('../models/Unit');
const { sendWhatsAppMessage } = require('../services/whatsappService');

// @desc    Compose and send a new WhatsApp message
// @route   POST /api/whatsapp/compose
// @access  Private (Admin)
const composeAndSendWhatsApp = asyncHandler(async (req, res) => {
  const {
    templateId,
    variables, // e.g., { "1": "value1", "2": "value2" }
    sendToType, // 'users', 'mikrotikGroup', 'location', 'unregistered'
    userIds,
    mikrotikRouterId,
    buildingId,
    unregisteredMobileNumber,
  } = req.body;

  if (!templateId || !sendToType) {
    res.status(400);
    throw new Error('Template ID and Send To Type are required');
  }

  const template = await WhatsAppTemplate.findById(templateId);
  if (!template) {
    res.status(404);
    throw new Error('WhatsApp template not found');
  }

  let recipientPhoneNumbers = [];

  // Reusing the same logic as the SMS composer to get phone numbers
  switch (sendToType) {
    case 'users':
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ message: 'User IDs are required' });
        return;
      }
      const users = await User.find({ _id: { $in: userIds } }).select('phoneNumber');
      recipientPhoneNumbers = users.map(user => user.phoneNumber).filter(Boolean);
      break;
    case 'mikrotikGroup':
      if (!mikrotikRouterId) {
        res.status(400).json({ message: 'Mikrotik Router ID is required' });
        return;
      }
      const mikrotikUsers = await MikrotikUser.find({ mikrotikRouter: mikrotikRouterId }).select('phoneNumber');
      recipientPhoneNumbers = mikrotikUsers.map(user => user.phoneNumber).filter(Boolean);
      break;
    case 'location':
      if (!buildingId) {
        res.status(400).json({ message: 'Building ID is required' });
        return;
      }
      const unitsInBuilding = await Unit.find({ building: buildingId }).populate('user', 'phoneNumber');
      recipientPhoneNumbers = unitsInBuilding.map(unit => unit.user?.phoneNumber).filter(Boolean);
      break;
    case 'unregistered':
      if (!unregisteredMobileNumber) {
        res.status(400).json({ message: 'Mobile number is required' });
        return;
      }
      recipientPhoneNumbers.push(unregisteredMobileNumber);
      break;
    default:
      res.status(400).json({ message: 'Invalid sendToType specified' });
      return;
  }

  if (recipientPhoneNumbers.length === 0) {
    res.status(400).json({ message: 'No valid recipient phone numbers found' });
    return;
  }

  const sentLogs = [];
  for (const phoneNumber of recipientPhoneNumbers) {
    const log = await WhatsAppLog.create({
      mobileNumber: phoneNumber,
      templateUsed: templateId,
      status: 'Pending',
      variablesUsed: variables,
      user: req.user._id,
    });

    try {
      const gatewayResponse = await sendWhatsAppMessage(phoneNumber, template.providerTemplateId, variables);
      
      log.status = gatewayResponse.success ? 'Queued' : 'Failed';
      log.providerResponse = gatewayResponse.message;
      await log.save();
      sentLogs.push(log);

    } catch (error) {
      log.status = 'Failed';
      log.providerResponse = { error: error.message };
      await log.save();
      sentLogs.push(log);
    }
  }

  res.status(200).json({ message: 'WhatsApp sending process initiated.', logs: sentLogs });
});

module.exports = {
  composeAndSendWhatsApp,
};