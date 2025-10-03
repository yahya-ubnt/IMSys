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
  
  const params = new URLSearchParams();
  params.append('partnerID', partnerID);
  params.append('apikey', apiKey);
  params.append('shortcode', senderId);
  params.append('mobile', phoneNumber);
  params.append('message', message);

  try {
    const response = await axios.get(endpoint, { params });

    // According to docs, the response is a JSON object within a string, so we parse it.
    const responseData = response.data;
    
    if (responseData && responseData.responses && responseData.responses[0].response-code === 200) {
      return { success: true, message: `SMS sent successfully to ${phoneNumber}. Message ID: ${responseData.responses[0]['message-id']}` };
    } else {
      const errorMessage = responseData.responses ? responseData.responses[0]['response-description'] : 'Unknown error from Celcom Africa';
      return { success: false, message: `Celcom Africa API Error: ${errorMessage}` };
    }
  } catch (error) {
    console.error('Error sending SMS via Celcom Africa:', error.response ? error.response.data : error.message);
    return { success: false, message: `Failed to send SMS via Celcom Africa: ${error.message}` };
  }
};