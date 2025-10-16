const axios = require('axios');

/**
 * Sends an SMS using the Celcom Africa API.
 * @param {object} credentials - The credentials for the Celcom Africa API.
 * @param {string} credentials.partnerId - The Partner ID.
 * @param {string} credentials.apiKey - The API Key.
 * @param {string} credentials.senderId - The Sender ID (shortcode).
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.sendMessage = async (credentials, phoneNumber, message) => {
  const { partnerID, apiKey, senderId } = credentials;

  if (!partnerID || !apiKey || !senderId) {
    return { success: false, message: 'Celcom Africa credentials are not fully configured.' };
  }

  const endpoint = 'https://isms.celcomafrica.com/api/services/sendsms/';
  
  const data = new URLSearchParams();
  data.append('partnerID', partnerID);
  data.append('apikey', apiKey);
  data.append('shortcode', senderId);
  data.append('mobile', phoneNumber);
  data.append('message', message);

  try {
    const response = await axios.post(endpoint, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const responseData = response.data;
    
    // Use bracket notation for property with a hyphen
    if (responseData && responseData.responses && responseData.responses[0]['response-code'] === 200) {
      return { success: true, message: `SMS sent successfully to ${phoneNumber}. Message ID: ${responseData.responses[0].messageid}` };
    } else {
      const errorMessage = responseData.responses ? responseData.responses[0]['response-description'] : 'Unknown error from Celcom Africa';
      return { success: false, message: `Celcom Africa API Error: ${errorMessage}` };
    }
  } catch (error) {
    console.error('Error sending SMS via Celcom Africa:', error.response ? error.response.data : error.message);
    return { success: false, message: `Failed to send SMS via Celcom Africa: ${error.message}` };
  }
};