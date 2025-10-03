const axios = require('axios');

/**
 * Sends an SMS using a generic HTTP POST request.
 * This is a flexible driver for providers that accept a simple JSON payload.
 * @param {object} credentials - The credentials for the generic provider.
 * @param {string} credentials.endpointUrl - The API endpoint URL.
 * @param {string} credentials.apiKey - The API Key (sent in the body).
 * @param {string} credentials.senderId - The Sender ID.
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.sendMessage = async (credentials, phoneNumber, message) => {
  const { endpointUrl, apiKey, senderId } = credentials;

  if (!endpointUrl || !apiKey || !senderId) {
    return { success: false, message: 'Generic HTTP provider credentials are not fully configured.' };
  }

  try {
    const response = await axios.post(endpointUrl, {
      to: phoneNumber,
      from: senderId,
      message: message,
      apiKey: apiKey, // Assuming the API key is sent in the body
    });

    // We make a basic assumption about the success response format.
    // This might need to be adjusted by the user for their specific provider.
    if (response.status >= 200 && response.status < 300) {
      return { success: true, message: 'SMS sent successfully via Generic HTTP.' };
    } else {
      const errorMessage = response.data.message || response.data.error || 'Unknown error';
      return { success: false, message: `Generic HTTP API Error: ${errorMessage}` };
    }
  } catch (error) {
    console.error('Error sending SMS via Generic HTTP:', error.response ? error.response.data : error.message);
    const errorMessage = error.response && error.response.data ? (error.response.data.message || error.response.data.error) : error.message;
    return { success: false, message: `Failed to send SMS via Generic HTTP: ${errorMessage}` };
  }
};