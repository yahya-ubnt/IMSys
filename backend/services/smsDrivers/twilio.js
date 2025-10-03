const axios = require('axios');

/**
 * Sends an SMS using the Twilio API.
 * @param {object} credentials - The credentials for the Twilio API.
 * @param {string} credentials.accountSid - The Account SID.
 * @param {string} credentials.authToken - The Auth Token.
 * @param {string} credentials.fromNumber - The Twilio phone number to send from.
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.sendMessage = async (credentials, phoneNumber, message) => {
  const { accountSid, authToken, fromNumber } = credentials;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, message: 'Twilio credentials are not fully configured.' };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const data = new URLSearchParams();
  data.append('To', phoneNumber);
  data.append('From', fromNumber);
  data.append('Body', message);

  try {
    const response = await axios.post(endpoint, data, {
      auth: {
        username: accountSid,
        password: authToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const responseData = response.data;

    if (response.status === 201 && responseData.sid) {
      return { success: true, message: `SMS queued successfully via Twilio. SID: ${responseData.sid}` };
    } else {
      return { success: false, message: `Twilio API Error: ${responseData.message || 'Unknown error'}` };
    }
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error.response ? error.response.data : error.message);
    const errorMessage = error.response && error.response.data ? error.response.data.message : error.message;
    return { success: false, message: `Failed to send SMS via Twilio: ${errorMessage}` };
  }
};