const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');
const User = require('../models/User');

// Connect to the database
connectDB();

const seedBillingTask = async () => {
  console.log('--- Starting Billing Task Seeder ---');

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

    // 2. Define the billing task
    const billingTask = {
      tenantOwner: tenantId,
      name: 'Automated Monthly Billing',
      description: 'Generates monthly bills for all active subscriptions based on the new subscription model.',
      scriptPath: 'scripts/generateBillsFromSubscriptions.js',
      schedule: '5 0 * * *', // Every day at 12:05 AM
      isEnabled: true,
    };

    // 3. Check if the task already exists and update it, or create it if it doesn't.
    const existingTask = await ScheduledTask.findOne({ name: billingTask.name, tenantOwner: tenantId });

    if (existingTask) {
      await ScheduledTask.updateOne({ _id: existingTask._id }, billingTask);
      console.log('Successfully updated the existing billing task.');
    } else {
      await ScheduledTask.create(billingTask);
      console.log('Successfully created a new billing task.');
    }

  } catch (error) {
    console.error('An error occurred during the billing task seeding process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
seedBillingTask();
