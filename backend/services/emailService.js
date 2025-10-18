const nodemailer = require('nodemailer');
const ApplicationSettings = require('../models/ApplicationSettings');
const { decrypt } = require('../utils/crypto');

/**
 * Sends an email by dynamically creating a transporter from DB settings.
 * @param {object} options - Email options.
 * @param {string} options.to - Recipient's email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body.
 * @param {string} options.html - HTML body.
 * @param {string} tenantOwner - The ID of the tenant to use for SMTP settings.
 * @returns {Promise<object>} - Nodemailer message info.
 */
const sendEmail = async ({ to, subject, text, html, tenantOwner }) => {
  try {
    // Fetch the settings from the database for the specific tenant.
    const settings = await ApplicationSettings.findOne({ tenantOwner }).select('+smtpSettings.pass');

    if (!settings || !settings.smtpSettings || !settings.smtpSettings.host) {
      throw new Error('SMTP settings are not configured for this tenant.');
    }

    const { host, port, secure, user, pass, from } = settings.smtpSettings;

    if (!pass) {
      throw new Error('SMTP password is not set.');
    }

    // Decrypt the password
    const decryptedPass = decrypt(pass);

    // Create a transporter object for each email send
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: decryptedPass,
      },
    });

    const mailOptions = {
      from: from || '"ISP Management" <no-reply@example.com>', // Use configured from or a default
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // We re-throw the error to be handled by the calling function
    throw error;
  }
};

module.exports = { sendEmail };
