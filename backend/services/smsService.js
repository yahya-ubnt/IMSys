const SmsProvider = require('../models/SmsProvider');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsLog = require('../models/SmsLog');
const MikrotikUser = require('../models/MikrotikUser'); // Added for sendBulkSms
const path = require('path');

/**
 * Dynamically loads and executes an SMS provider driver.
 * @param {string} providerType - The type of the provider (e.g., 'celcom', 'twilio').
 * @param {object} credentials - The decrypted credentials for the provider.
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>} - The result from the provider.
 */
const executeSmsDriver = async (providerType, credentials, phoneNumber, message) => {
  try {
    const driverPath = path.join(__dirname, 'smsDrivers', `${providerType}.js`);
    const driver = require(driverPath);
    return await driver.sendMessage(credentials, phoneNumber, message);
  } catch (error) {
    console.error(`Error loading or executing SMS driver for '${providerType}':`, error);
    // Check if the error is because the driver module doesn't exist
    if (error.code === 'MODULE_NOT_FOUND') {
      return { success: false, message: `SMS provider driver for '${providerType}' not found.` };
    }
    return { success: false, message: `An unexpected error occurred with the '${providerType}' SMS driver.` };
  }
};

exports.sendSMS = async (tenant, phoneNumber, message) => {
  try {
    if (!tenant) {
      console.error('Error: A tenant ID must be provided to sendSMS.');
      return { success: false, message: 'Tenant context is missing.' };
    }

    // 1. Find the active SMS provider for the specific tenant from the database
    const activeProvider = await SmsProvider.findOne({ tenant, isActive: true });

    if (!activeProvider) {
      console.error(`No active SMS provider is configured for tenant ${tenant}.`);
      return { success: false, message: 'SMS service is not configured for this tenant. No active provider found.' };
    }

    // 2. The model's 'get' function automatically decrypts credentials
    const credentials = activeProvider.credentials;
    if (!credentials) {
        console.error(`Failed to decrypt credentials for provider: ${activeProvider.name}`);
        return { success: false, message: 'Credential decryption failed.' };
    }

    // 3. Execute the appropriate driver
    const result = await executeSmsDriver(
      activeProvider.providerType,
      credentials,
      phoneNumber,
      message
    );

    console.log(`SMS to ${phoneNumber} via ${activeProvider.name}: ${result.message}`);
    return result;

  } catch (error) {
    console.error(`Error sending SMS to ${phoneNumber}:`, error.message);
    return { success: false, message: `Failed to send SMS: ${error.message}` };
  }
};

exports.sendAcknowledgementSms = async (triggerType, recipientPhoneNumber, data = {}) => {
  try {
    const tenant = data.tenant;
    if (!tenant) {
        console.error(`Error sending acknowledgement for ${triggerType}: tenant was not provided in the data object.`);
        return { success: false, message: 'Cannot send acknowledgement SMS without a tenant context.' };
    }

    const acknowledgement = await SmsAcknowledgement.findOne({ triggerType, tenant, status: 'Active' }).populate('smsTemplate');

    if (!acknowledgement || !acknowledgement.smsTemplate) {
      console.log(`No active acknowledgement mapping found for trigger type: ${triggerType}`);
      return { success: false, message: 'No active acknowledgement mapping found.' };
    }

    let messageBody = acknowledgement.smsTemplate.messageBody;

    // Personalize message using data provided
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        messageBody = messageBody.replace(placeholder, data[key]);
      }
    }

    const smsResult = await exports.sendSMS(tenant, recipientPhoneNumber, messageBody);

    await SmsLog.create({
      mobileNumber: recipientPhoneNumber,
      message: messageBody,
      messageType: 'Acknowledgement',
      smsStatus: smsResult.success ? 'Success' : 'Failed',
      providerResponse: smsResult.message,
      tenant: tenant, // Associate log with the tenant
      mikrotikUser: data.mikrotikUser, // Associate log with the Mikrotik user
    });

    return { success: smsResult.success, message: smsResult.message };

  } catch (error) {
    console.error(`Error sending acknowledgement SMS for trigger ${triggerType}:`, error.message);
    return { success: false, message: `Failed to send acknowledgement SMS: ${error.message}` };
  }
};

exports.sendBulkSms = async (message, sendToType, recipientIds, tenantId, unregisteredMobileNumber = null) => {
  if (!message) throw new Error('Message body is required');
  if (!tenantId) throw new Error('Tenant ID is required');

  let usersToSend = [];

  switch (sendToType) {
    case 'users':
      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        throw new Error('User IDs are required for sending to users');
      }
      usersToSend = await MikrotikUser.find({ _id: { $in: recipientIds }, tenant: tenantId });
      break;

    case 'mikrotik':
      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        throw new Error('Mikrotik Router IDs are required for sending to Mikrotik group');
      }
      usersToSend = await MikrotikUser.find({ mikrotikRouter: { $in: recipientIds }, tenant: tenantId });
      break;

    case 'location':
      if (!recipientIds || !ArrayArray(recipientIds) || recipientIds.length === 0) {
        throw new Error('Apartment/House Numbers are required for sending to location');
      }
      usersToSend = await MikrotikUser.find({ apartment_house_number: { $in: recipientIds }, tenant: tenantId });
      break;

    case 'unregistered':
      if (!unregisteredMobileNumber) {
        throw new Error('Mobile number is required for sending to unregistered users');
      }
      usersToSend.push({ mobileNumber: unregisteredMobileNumber, _id: null });
      break;

    default:
      throw new Error('Invalid sendToType specified');
  }

  if (usersToSend.length === 0) {
    throw new Error('No valid recipients found for the selected criteria.');
  }

  const sentLogs = [];
  for (const user of usersToSend) {
    if (!user.mobileNumber) continue;

    const log = await SmsLog.create({
      mobileNumber: user.mobileNumber,
      message: message,
      messageType: 'Compose New Message',
      smsStatus: 'Pending',
      tenant: tenantId,
      mikrotikUser: user._id,
    });

    try {
      const gatewayResponse = await exports.sendSMS(tenantId, user.mobileNumber, message);
      log.smsStatus = gatewayResponse.success ? 'Success' : 'Failed';
      log.providerResponse = gatewayResponse.message;
      await log.save();
      sentLogs.push(log);
    } catch (error) {
      log.smsStatus = 'Failed';
      log.providerResponse = { error: error.message };
      await log.save();
      sentLogs.push(log);
      console.error(`Failed to send SMS to ${user.mobileNumber}: ${error.message}`);
    }
  }
  return sentLogs;
};

exports.getSmsLogs = async (tenantId, queryParams) => {
  const { search, messageType, status, startDate, endDate, page = 1, limit = 25 } = queryParams;
  const query = { tenant: tenantId };

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    query.$or = [
      { mobileNumber: searchRegex },
      { message: searchRegex },
    ];
  }

  if (messageType) query.messageType = messageType;
  if (status) query.smsStatus = status;

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const count = await SmsLog.countDocuments(query);
  const logs = await SmsLog.find(query)
    .limit(parseInt(limit))
    .skip(parseInt(limit) * (parseInt(page) - 1))
    .sort({ createdAt: -1 });

  const statsAggregation = await SmsLog.aggregate([
    { $match: query },
    { $group: { _id: '$smsStatus', count: { $sum: 1 } } }
  ]);

  const stats = {
    total: count,
    success: 0,
    failed: 0,
  };

  statsAggregation.forEach(s => {
    if (s._id === 'Success') stats.success = s.count;
    if (s._id === 'Failed') stats.failed = s.count;
  });

  return { logs, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)), total: count, stats };
};

exports.getSmsLogsForUser = async (userId, tenantId) => {
  // Verify the user exists and belongs to the tenant
  const user = await MikrotikUser.findOne({ _id: userId, tenant: tenantId });
  if (!user) {
    const error = new Error('Mikrotik user not found');
    error.statusCode = 404;
    throw error;
  }

  const logs = await SmsLog.find({ mikrotikUser: userId }).sort({ createdAt: -1 });

  // Calculate stats
  const stats = {
    total: logs.length,
    acknowledgement: logs.filter(log => log.messageType === 'Acknowledgement').length,
    expiry: logs.filter(log => log.messageType === 'Expiry Alert').length,
    composed: logs.filter(log => log.messageType === 'Compose New Message').length,
    system: logs.filter(log => log.messageType === 'System').length,
  };

  return { logs, stats };
};