const axios = require('axios');

/**
 * Sends a templated WhatsApp message using the Twilio API.
 * @param {object} credentials - The credentials for the Twilio API.
 * @param {string} credentials.accountSid - The Account SID.
 * @param {string} credentials.authToken - The Auth Token.
 * @param {string} credentials.fromNumber - The Twilio WhatsApp-enabled number (e.g., 'whatsapp:+14155238886').
 * @param {string} recipientPhoneNumber - The recipient's phone number (e.g., 'whatsapp:+254712345678').
 * @param {string} templateSid - The Content SID of the pre-approved template.
 * @param {object} templateParameters - Key-value pairs for the template's variables.
 * @returns {Promise<{success: boolean, message: string}>}
 */
exports.sendTemplatedMessage = async (credentials, recipientPhoneNumber, templateSid, templateParameters) => {
  const { accountSid, authToken, fromNumber } = credentials;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, message: 'Twilio for WhatsApp credentials are not fully configured.' };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const data = new URLSearchParams();
  data.append('To', recipientPhoneNumber.startsWith('whatsapp:') ? recipientPhoneNumber : `whatsapp:${recipientPhoneNumber}`);
  data.append('From', fromNumber);
  data.append('ContentSid', templateSid);

  if (templateParameters) {
    data.append('ContentVariables', JSON.stringify(templateParameters));
  }

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
      return { success: true, message: `WhatsApp message queued successfully via Twilio. SID: ${responseData.sid}` };
    } else {
      return { success: false, message: `Twilio API Error: ${responseData.message || 'Unknown error'}` };
    }
  } catch (error) {
    console.error('Error sending WhatsApp via Twilio:', error.response ? error.response.data : error.message);
    const errorMessage = error.response && error.response.data ? error.response.data.message : error.message;
    return { success: false, message: `Failed to send WhatsApp via Twilio: ${errorMessage}` };
  }
};