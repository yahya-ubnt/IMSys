const axios = require('axios');

/**
 * Sends an SMS using the Africa's Talking API.
 * @param {object} credentials - The credentials for the Africa's Talking API.
 * @param {string} credentials.username - The application username.
 * @param {string} credentials.apiKey - The API Key.
 * @param {string} credentials.senderId - The Sender ID (shortcode or alphanumeric).
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.sendMessage = async (credentials, phoneNumber, message) => {
  const { username, apiKey, senderId } = credentials;

  if (!username || !apiKey || !senderId) {
    return { success: false, message: "Africa's Talking credentials are not fully configured." };
  }

  // Use the sandbox endpoint for development, live for production
  const endpoint = username === 'sandbox' 
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';

  const data = new URLSearchParams();
  data.append('username', username);
  data.append('to', phoneNumber);
  data.append('message', message);
  data.append('from', senderId);

  try {
    const response = await axios.post(endpoint, data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
    });

    const responseData = response.data;
    const recipients = responseData.SMSMessageData.Recipients;

    if (recipients && recipients.length > 0 && recipients[0].statusCode === 101) {
      return { success: true, message: `SMS sent successfully to ${recipients[0].number}. Message ID: ${recipients[0].messageId}` };
    } else {
      const errorMessage = recipients ? recipients[0].message : 'Unknown error from Africa\'s Talking';
      return { success: false, message: `Africa's Talking API Error: ${errorMessage}` };
    }
  } catch (error) {
    console.error("Error sending SMS via Africa's Talking:", error.response ? error.response.data : error.message);
    const errorMessage = error.response && error.response.data && error.response.data.SMSMessageData 
      ? error.response.data.SMSMessageData.Recipients[0].message 
      : error.message;
    return { success: false, message: `Failed to send SMS via Africa's Talking: ${errorMessage}` };
  }
};
