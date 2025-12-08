const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');

const deleteBillingTask = async () => {
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    console.log('Deleting "Automated Monthly Billing" tasks from the database...');
    const deleteResult = await ScheduledTask.deleteMany({ name: 'Automated Monthly Billing' });
    console.log(`Deleted ${deleteResult.deletedCount} "Automated Monthly Billing" tasks.`);
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

deleteBillingTask();
