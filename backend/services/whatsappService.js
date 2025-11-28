
const WhatsAppProvider = require('../models/WhatsAppProvider');
const path = require('path');

/**
 * Dynamically loads and executes a WhatsApp provider driver.
 * @param {string} providerType - The type of the provider (e.g., 'twilio').
 * @param {object} credentials - The decrypted credentials for the provider.
 * @param {string} recipientPhoneNumber - The recipient's phone number.
 * @param {string} templateName - The name of the pre-approved message template.
 * @param {object} templateParameters - The parameters to populate the template.
 * @returns {Promise<{success: boolean, message: string}>} - The result from the provider.
 */
const executeWhatsAppDriver = async (providerType, credentials, recipientPhoneNumber, templateName, templateParameters) => {
  try {
    const driverPath = path.join(__dirname, 'whatsappDrivers', `${providerType}.js`);
    const driver = require(driverPath);
    return await driver.sendTemplatedMessage(credentials, recipientPhoneNumber, templateName, templateParameters);
  } catch (error) {
    console.error(`Error loading or executing WhatsApp driver for '${providerType}':`, error);
    if (error.code === 'MODULE_NOT_FOUND') {
      return { success: false, message: `WhatsApp provider driver for '${providerType}' not found.` };
    }
    return { success: false, message: `An unexpected error occurred with the '${providerType}' WhatsApp driver.` };
  }
};

const sendWhatsAppMessage = async (tenant, recipientPhoneNumber, templateName, templateParameters) => {
  try {
    const activeProvider = await WhatsAppProvider.findOne({ tenant, isActive: true });

    if (!activeProvider) {
      console.error('No active WhatsApp provider is configured for this tenant.');
      return { success: false, message: 'WhatsApp service is not configured for this tenant. No active provider found.' };
    }

    const credentials = activeProvider.credentials;
    if (!credentials) {
        console.error(`Failed to decrypt credentials for provider: ${activeProvider.name}`);
        return { success: false, message: 'Credential decryption failed.' };
    }

    const result = await executeWhatsAppDriver(
      activeProvider.providerType,
      credentials,
      recipientPhoneNumber,
      templateName,
      templateParameters
    );

    console.log(`WhatsApp to ${recipientPhoneNumber} via ${activeProvider.name}: ${result.message}`);
    return result;

  } catch (error) {
    console.error(`Error sending WhatsApp to ${recipientPhoneNumber}:`, error.message);
    return { success: false, message: `Failed to send WhatsApp message: ${error.message}` };
  }
};

module.exports = {
  sendWhatsAppMessage,
};
