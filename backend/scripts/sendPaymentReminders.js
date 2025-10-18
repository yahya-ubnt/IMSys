const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const SmsTemplate = require('../models/SmsTemplate');
const SmsLog = require('../models/SmsLog');
const { sendSMS } = require('../services/smsService');

// --- Configuration ---
// The name of the SMS template to use for reminders.
const REMINDER_TEMPLATE_NAME = 'Payment Reminder';
// How many days before expiry to send the reminder.
const REMINDER_DAYS_BEFORE_EXPIRY = 3;


const sendPaymentReminders = async () => {
  console.log(`[${new Date().toISOString()}] --- Starting Payment Reminder Script ---`);

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log(`[${new Date().toISOString()}] Connected to MongoDB.`);

    // 1. Find the SMS Template
    const reminderTemplate = await SmsTemplate.findOne({ name: REMINDER_TEMPLATE_NAME, tenantOwner: tenantId });
    if (!reminderTemplate) {
      console.error(`[${new Date().toISOString()}] Error: SMS template named '${REMINDER_TEMPLATE_NAME}' not found for this tenant. Please create it in the application settings. Script will now exit.`);
      return;
    }
    console.log(`[${new Date().toISOString()}] Found SMS template: '${REMINDER_TEMPLATE_NAME}'.`);

    // 2. Calculate the target expiry date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + REMINDER_DAYS_BEFORE_EXPIRY);

    const startOfTargetDay = new Date(targetDate);
    startOfTargetDay.setHours(0, 0, 0, 0);
    const endOfTargetDay = new Date(targetDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    console.log(`[${new Date().toISOString()}] Searching for users expiring on: ${startOfTargetDay.toLocaleDateString()}`);

    // 3. Find all users expiring on the target date
    const usersToRemind = await MikrotikUser.find({
      tenantOwner: tenantId,
      expiryDate: {
        $gte: startOfTargetDay,
        $lte: endOfTargetDay,
      },
    });

    if (usersToRemind.length === 0) {
      console.log(`[${new Date().toISOString()}] No users found expiring in ${REMINDER_DAYS_BEFORE_EXPIRY} days for this tenant. Script finished.`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Found ${usersToRemind.length} user(s) to remind.`);

    // 4. Loop through users and send reminders
    for (const user of usersToRemind) {
      let messageBody = reminderTemplate.messageBody;

      // Personalize the message
      messageBody = messageBody.replace(/{{name}}/g, user.officialName);
      messageBody = messageBody.replace(/{{expiryDate}}/g, new Date(user.expiryDate).toLocaleDateString());
      messageBody = messageBody.replace(/{{daysLeft}}/g, REMINDER_DAYS_BEFORE_EXPIRY);
      messageBody = messageBody.replace(/{{accountNumber}}/g, user.mPesaRefNo);

      console.log(`[${new Date().toISOString()}] Sending reminder to ${user.officialName} (${user.mobileNumber}).`);
      
      const smsResult = await sendSMS(user.tenantOwner, user.mobileNumber, messageBody);

      // 5. Log the result
      await SmsLog.create({
        mobileNumber: user.mobileNumber,
        message: messageBody,
        messageType: 'Expiry Alert',
        smsStatus: smsResult.success ? 'Success' : 'Failed',
        providerResponse: smsResult.message,
        tenantOwner: user.tenantOwner, // Link the log to the tenant
      });

      if (smsResult.success) {
        console.log(`[${new Date().toISOString()}] Successfully sent SMS to ${user.username}.`);
      } else {
        console.error(`[${new Date().toISOString()}] Failed to send SMS to ${user.username}. Reason: ${smsResult.message}`);
      }
    }

    console.log(`[${new Date().toISOString()}] --- Payment Reminder Script Finished ---`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] An unexpected error occurred:`, error);
  } finally {
    // Ensure the database connection is closed
    await mongoose.connection.close();
    console.log(`[${new Date().toISOString()}] MongoDB connection closed.`);
  }
};

// Execute the script
sendPaymentReminders();
