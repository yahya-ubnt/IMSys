const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import all the log models that need cleanup
const SmsLog = require('../models/SmsLog');
const DiagnosticLog = require('../models/DiagnosticLog');
const TrafficLog = require('../models/TrafficLog');
const UserDowntimeLog = require('../models/UserDowntimeLog');

// --- Configuration ---
// Define the retention period in days for each log type.
const RETENTION_PERIODS = {
  SmsLog: 180,
  DiagnosticLog: 90,
  TrafficLog: 60, // This can grow fast, so a shorter period is wise.
  UserDowntimeLog: 180,
};

// A helper function to perform the cleanup for a specific model
const cleanupModel = async (model, modelName, daysToKeep) => {
  try {
    if (!daysToKeep || daysToKeep <= 0) {
      console.log(`[${new Date().toISOString()}] Skipping cleanup for ${modelName} - invalid retention period.`);
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    console.log(`[${new Date().toISOString()}] Deleting ${modelName} records older than ${cutoffDate.toLocaleDateString()}...`);

    const result = await model.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`[${new Date().toISOString()}] Success! Deleted ${result.deletedCount} records from ${modelName}.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up ${modelName}:`, error);
  }
};

const cleanupOldLogs = async () => {
  console.log(`[${new Date().toISOString()}] --- Starting Database Log Cleanup Script ---`);

  try {
    await connectDB();
    console.log(`[${new Date().toISOString()}] Connected to MongoDB.`);

    // Sequentially clean up each log collection
    await cleanupModel(SmsLog, 'SmsLog', RETENTION_PERIODS.SmsLog);
    await cleanupModel(DiagnosticLog, 'DiagnosticLog', RETENTION_PERIODS.DiagnosticLog);
    await cleanupModel(TrafficLog, 'TrafficLog', RETENTION_PERIODS.TrafficLog);
    await cleanupModel(UserDowntimeLog, 'UserDowntimeLog', RETENTION_PERIODS.UserDowntimeLog);

    console.log(`[${new Date().toISOString()}] --- Database Log Cleanup Script Finished ---`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] An unexpected error occurred during the cleanup process:`, error);
  } finally {
    // Ensure the database connection is closed
    await mongoose.connection.close();
    console.log(`[${new Date().toISOString()}] MongoDB connection closed.`);
  }
};

// Execute the script
cleanupOldLogs();
