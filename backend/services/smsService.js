const SmsProvider = require('../models/SmsProvider');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsLog = require('../models/SmsLog');
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
    });

    return { success: smsResult.success, message: smsResult.message };

  } catch (error) {
    console.error(`Error sending acknowledgement SMS for trigger ${triggerType}:`, error.message);
    return { success: false, message: `Failed to send acknowledgement SMS: ${error.message}` };
  }
};