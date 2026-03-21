// This script deletes old SMS templates that do not have a 'triggerType' field.
// This is intended to be run after the `migrate-sms-templates.js` script.
//
// ** IMPORTANT **
// 1. BACK UP YOUR DATABASE BEFORE RUNNING THIS SCRIPT.
// 2. This script permanently deletes data.

require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SmsTemplate = require('../models/SmsTemplate');

const cleanupOldTemplates = async () => {
  await connectDB();

  console.log('Starting cleanup of old SMS templates...');

  try {
    const result = await SmsTemplate.deleteMany({
      triggerType: { $exists: false }
    });

    console.log(`Cleanup complete. Deleted ${result.deletedCount} old templates.`);

  } catch (error) {
    console.error('An error occurred during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
};

cleanupOldTemplates();
