const axios = require('axios');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsTemplate = require('../models/SmsTemplate');
const SmsLog = require('../models/SmsLog');

const {
  SMS_PROVIDER,
  SMS_API_KEY,
  SMS_API_SECRET,
  SMS_SENDER_ID,
  SMS_ENDPOINT_URL,
  SMS_ACCOUNT_SID,
  SMS_AUTH_TOKEN,
} = process.env;

exports.sendSMS = async (phoneNumber, message) => {
  try {
    let response;

    switch (SMS_PROVIDER) {
      case 'GENERIC_HTTP':
        if (!SMS_ENDPOINT_URL || !SMS_API_KEY || !SMS_SENDER_ID) {
          console.error('Missing environment variables for GENERIC_HTTP SMS provider.');
          return { success: false, message: 'SMS service not configured properly.' };
        }
        response = await axios.post(SMS_ENDPOINT_URL, {
          to: phoneNumber,
          from: SMS_SENDER_ID,
          message: message,
          apiKey: SMS_API_KEY,
        });
        console.log(`Generic HTTP SMS response:`, response.data);
        if (response.status === 200 && response.data.status === 'success') {
          return { success: true, message: 'SMS sent successfully via Generic HTTP.' };
        } else {
          return { success: false, message: `Failed to send SMS via Generic HTTP: ${response.data.message || 'Unknown error'}` };
        }

      default:
        console.warn(`Unsupported SMS_PROVIDER: ${SMS_PROVIDER}. SMS not sent.`);
        return { success: false, message: `Unsupported SMS provider: ${SMS_PROVIDER}.` };
    }
  } catch (error) {
    console.error(`Error sending SMS to ${phoneNumber}:`, error.message);
    if (error.response) {
      console.error('SMS Provider Error Response:', error.response.data);
    }
    return { success: false, message: `Failed to send SMS: ${error.message}` };
  }
};

exports.sendAcknowledgementSms = async (triggerType, recipientPhoneNumber, data = {}) => {
  try {
    const acknowledgement = await SmsAcknowledgement.findOne({ triggerType, status: 'Active' }).populate('smsTemplate');

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

    const smsResult = await exports.sendSMS(recipientPhoneNumber, messageBody);

    await SmsLog.create({
      mobileNumber: recipientPhoneNumber,
      message: messageBody,
      messageType: 'Acknowledgement',
      smsStatus: smsResult.success ? 'Success' : 'Failed',
      providerResponse: smsResult.message,
      // user: data.userId, // If userId is available in data
    });

    return { success: smsResult.success, message: smsResult.message };

  } catch (error) {
    console.error(`Error sending acknowledgement SMS for trigger ${triggerType}:`, error.message);
    return { success: false, message: `Failed to send acknowledgement SMS: ${error.message}` };
  }
};