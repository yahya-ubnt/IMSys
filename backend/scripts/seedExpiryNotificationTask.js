const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const User = require('../models/User');

// Connect to the database
connectDB();

const seedExpiryNotificationTask = async () => {
  console.log('--- Starting Expiry Notification Task Seeder ---');

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    // 1. Find the tenant
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      console.error('Error: Tenant not found.');
      return;
    }

    // 2. Define the notification task
    const notificationTask = {
      tenantOwner: tenantId,
      name: 'SMS Expiry Notification',
      description: 'Sends expiry notifications to customers based on configurable schedules with robust logic.',
      scriptPath: 'scripts/sendExpiryNotifications.js',
      schedule: '0 0 * * *', // Every day at midnight
      isEnabled: true,
    };

    // 3. Check if the task already exists and update it, or create it if it doesn't.
    const existingTask = await ScheduledTask.findOne({ name: notificationTask.name, tenantOwner: tenantId });

    if (existingTask) {
      await ScheduledTask.updateOne({ _id: existingTask._id }, notificationTask);
      console.log('Successfully updated the existing expiry notification task.');
    } else {
      await ScheduledTask.create(notificationTask);
      console.log('Successfully created a new expiry notification task.');
    }

  } catch (error) {
    console.error('An error occurred during the task seeding process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
seedExpiryNotificationTask();
