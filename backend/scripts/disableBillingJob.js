// backend/scripts/disableBillingJob.js

/**
 * One-time script to disable the legacy "Generate Monthly Billing" scheduled task
 * for all tenants in the database.
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');

const disableBillingJob = async () => {
  console.log('Attempting to disable "Generate Monthly Billing" scheduled task...');

  try {
    const taskName = 'Generate Monthly Billing';

    const result = await ScheduledTask.updateMany(
      { name: taskName },
      { $set: { isEnabled: false } }
    );

    if (result.matchedCount === 0) {
      console.log(`- No scheduled task named "${taskName}" found. Nothing to disable.`);
    } else {
      console.log(`- Success: Matched ${result.matchedCount} task(s) named "${taskName}".`);
      console.log(`- Updated ${result.modifiedCount} task(s) to be disabled.`);
    }

  } catch (error) {
    console.error('An error occurred while disabling the billing job:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

// Connect to DB and run the script
(async () => {
  await connectDB();
  await disableBillingJob();
})();
