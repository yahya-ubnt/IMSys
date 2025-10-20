const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const ScheduledTask = require('../models/ScheduledTask');

const defaultTasks = [
  {
    name: 'Automated Monthly Billing',
    description: 'Generates monthly bills for all active subscriptions based on the new subscription model.',
    scriptPath: 'scripts/generateBillsFromSubscriptions.js',
    schedule: '5 0 * * *', // Every day at 12:05 AM
    isEnabled: true,
  },
  {
    name: 'Automated Disconnection of Expired Users',
    description: 'Disconnects users from the network whose expiryDate has passed.',
    scriptPath: 'scripts/disconnectExpiredClients.js',
    schedule: '59 23 * * *', // Every day at 11:59 PM
    isEnabled: true,
  },
  {
    name: 'Automated Payment Reminders',
    description: 'Sends SMS reminders to customers whose subscription is expiring in 3 days.',
    scriptPath: 'scripts/sendPaymentReminders.js',
    schedule: '0 8 * * *', // Every day at 8:00 AM
    isEnabled: true,
  },
  {
    name: 'Automated Database Log Cleanup',
    description: 'Archives or deletes old log records to maintain database performance.',
    scriptPath: 'scripts/cleanupOldLogs.js',
    schedule: '5 3 * * 0', // Every Sunday at 3:05 AM
    isEnabled: true,
  },
  {
    name: 'SMS Expiry Notification',
    description: 'Sends expiry notifications to customers based on configurable schedules with robust logic.',
    scriptPath: 'scripts/sendExpiryNotifications.js',
    schedule: '0 0 * * *', // Every day at midnight
    isEnabled: true,
  },
];

const backfillDefaultScheduledTasks = async () => {
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    const adminTenants = await User.find({ roles: 'ADMIN_TENANT' });
    console.log(`Found ${adminTenants.length} ADMIN_TENANT(s).`);

    for (const tenant of adminTenants) {
      console.log(`Processing tenant: ${tenant.fullName} (${tenant._id})`);
      for (const defaultTask of defaultTasks) {
        const existingTask = await ScheduledTask.findOne({
          name: defaultTask.name,
          tenantOwner: tenant._id,
        });

        if (!existingTask) {
          await ScheduledTask.create({
            ...defaultTask,
            tenantOwner: tenant._id,
          });
          console.log(`  Created missing task: "${defaultTask.name}" for tenant ${tenant.fullName}`);
        } else {
          console.log(`  Task "${defaultTask.name}" already exists for tenant ${tenant.fullName}. Skipping.`);
        }
      }
    }
    console.log('Backfill process completed successfully!');
  } catch (error) {
    console.error('Error during backfill process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

backfillDefaultScheduledTasks();
