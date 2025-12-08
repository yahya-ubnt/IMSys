const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const ScheduledTask = require('../models/ScheduledTask');

const defaultTasks = [
  {
    name: 'Automated Disconnection of Expired Users',
    description: 'Disconnects users from the network whose expiryDate has passed.',
    scriptPath: 'scripts/disconnectExpiredClients.js',
    schedule: '59 23 * * *', // Every day at 11:59 PM
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
    const tenants = await Tenant.find({});
    console.log(`Found ${tenants.length} Tenant(s).`);

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant._id})`);
      for (const defaultTask of defaultTasks) {
        const existingTask = await ScheduledTask.findOne({
          name: defaultTask.name,
          tenant: tenant._id,
        });

        if (!existingTask) {
          await ScheduledTask.create({
            ...defaultTask,
            tenant: tenant._id,
          });
          console.log(`  Created missing task: "${defaultTask.name}" for tenant ${tenant.name}`);
        } else {
          console.log(`  Task "${defaultTask.name}" already exists for tenant ${tenant.name}. Skipping.`);
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
