const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');

const tasks = [
  {
    name: 'Automated Monthly Billing',
    description: 'Generates a Debit transaction for each user\'s monthly bill.',
    scriptPath: 'scripts/generateMonthlyDebits.js',
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
];

const seedTasks = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    for (const taskData of tasks) {
      // Use findOneAndUpdate with upsert to avoid creating duplicates
      await ScheduledTask.findOneAndUpdate(
        { name: taskData.name },
        taskData,
        { new: true, upsert: true, runValidators: true }
      );
      console.log(`Successfully created/updated task: "${taskData.name}"`);
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
