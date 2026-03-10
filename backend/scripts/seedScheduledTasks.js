const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const User = require('../models/User');

const tasks = [
  {
    name: 'Automated Monthly Billing',
    description: 'Generates a Debit transaction for each user\'s monthly bill.',
    scriptPath: 'scripts/triggerBillingWorker.js',
    schedule: '5 0 * * *', // Every day at 12:05 AM
    isEnabled: true,
  },
  {
    name: 'Automated Disconnection of Expired Users',
    description: 'Disconnects users from the network whose expiryDate has passed.',
    scriptPath: 'scripts/triggerDisconnectWorker.js',
    schedule: '59 23 * * *', // Every day at 11:59 PM
    isEnabled: true,
  },
  {
    name: 'Automated Payment Reminders',
    description: 'Sends SMS reminders to customers whose subscription is expiring in 3 days.',
    scriptPath: 'scripts/triggerReminderWorker.js',
    schedule: '0 8 * * *', // Every day at 8:00 AM
    isEnabled: true,
  },
  {
    name: 'Disconnect Expired Hotspot Clients',
    description: 'Removes IP bindings for hotspot users whose session has expired.',
    scriptPath: 'scripts/triggerDisconnectHotspotWorker.js',
    schedule: '* * * * *', // Every minute - for testing
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
    description: 'Sends SMS reminders to customers whose subscription is expiring.',
    scriptPath: 'scripts/triggerReminderWorker.js',
    schedule: '0 8 * * *', // Default schedule
    isEnabled: true,
  },
];

const seedTasks = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    const superAdmin = await User.findOne({ roles: 'SUPER_ADMIN' });
    if (!superAdmin) {
      console.error('SUPER_ADMIN not found. Please run the seeder first.');
      process.exit(1);
    }

    for (const taskData of tasks) {
      // Use a more robust find-loop-save strategy to ensure all documents are updated.
      const tasksToUpdate = await ScheduledTask.find({ name: taskData.name });

      if (tasksToUpdate.length > 0) {
        let updatedCount = 0;
        for (const task of tasksToUpdate) {
          let changed = false;
          if (task.scriptPath !== taskData.scriptPath) {
            task.scriptPath = taskData.scriptPath;
            changed = true;
          }
          if (task.schedule !== taskData.schedule) { // Add this condition
            task.schedule = taskData.schedule;
            changed = true;
          }
          if (changed) {
            await task.save();
            updatedCount++;
          }
        }
        if (updatedCount > 0) {
          console.log(`Successfully updated ${updatedCount} instance(s) of task: "${taskData.name}"`);
        } else {
          console.log(`All instances of "${taskData.name}" were already up-to-date.`);
        }
      } else {
        console.log(`No existing tasks found for "${taskData.name}".`);
      }
    }

    console.log('\nSeeding complete. All scheduled tasks have been added to the database.');

  } catch (error) {
    console.error('An error occurred during task seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedTasks();
