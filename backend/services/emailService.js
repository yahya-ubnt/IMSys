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
 * @returns {Promise<object>} - Nodemailer message info.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Fetch the settings from the database. We assume a single settings document.
    // The .select('+smtpSettings.pass') is crucial to explicitly include the password.
    const settings = await ApplicationSettings.findOne().select('+smtpSettings.pass');

    if (!settings || !settings.smtpSettings || !settings.smtpSettings.host) {
      throw new Error('SMTP settings are not configured.');
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
