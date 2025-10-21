const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import all the log models that need cleanup
const ApplicationSettings = require('../models/ApplicationSettings');
const MikrotikUser = require('../models/MikrotikUser');
const SmsLog = require('../models/SmsLog');
const DiagnosticLog = require('../models/DiagnosticLog');
const TrafficLog = require('../models/TrafficLog');
const UserDowntimeLog = require('../models/UserDowntimeLog');

// A helper function to perform the cleanup for a specific model
const cleanupModel = async (model, modelName, daysToKeep, tenantOwner) => {
  try {
    if (!daysToKeep || daysToKeep <= 0) {
      console.log(`[${new Date().toISOString()}] Skipping cleanup for ${modelName} - invalid retention period.`);
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    console.log(`[${new Date().toISOString()}] Deleting ${modelName} records for tenant ${tenantOwner} older than ${cutoffDate.toLocaleDateString()}...`);

    const result = await model.deleteMany({
      tenantOwner,
      createdAt: { $lt: cutoffDate },
    });

    console.log(`[${new Date().toISOString()}] Success! Deleted ${result.deletedCount} records from ${modelName} for tenant ${tenantOwner}.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up ${modelName} for tenant ${tenantOwner}:`, error);
  }
};

// A special helper for TrafficLog which is linked via user, not directly to the tenant
const cleanupTrafficLog = async (daysToKeep, tenantOwner) => {
  const modelName = 'TrafficLog';
  try {
    if (!daysToKeep || daysToKeep <= 0) {
      console.log(`[${new Date().toISOString()}] Skipping cleanup for ${modelName} - invalid retention period.`);
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    console.log(`[${new Date().toISOString()}] Finding users for tenant ${tenantOwner} to clean up ${modelName}...`);
    const usersOfTenant = await MikrotikUser.find({ tenantOwner }).select('_id');
    if (usersOfTenant.length === 0) {
      console.log(`[${new Date().toISOString()}] No users found for tenant ${tenantOwner}, skipping ${modelName} cleanup.`);
      return;
    }
    const userIds = usersOfTenant.map(u => u._id);

    console.log(`[${new Date().toISOString()}] Deleting ${modelName} records for tenant ${tenantOwner} older than ${cutoffDate.toLocaleDateString()}...`);

    const result = await TrafficLog.deleteMany({
      user: { $in: userIds },
      createdAt: { $lt: cutoffDate },
    });

    console.log(`[${new Date().toISOString()}] Success! Deleted ${result.deletedCount} records from ${modelName} for tenant ${tenantOwner}.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up ${modelName} for tenant ${tenantOwner}:`, error);
  }
};

const cleanupOldLogs = async () => {
  console.log(`[${new Date().toISOString()}] --- Starting Database Log Cleanup Script ---`);

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log(`[${new Date().toISOString()}] Connected to MongoDB.`);

    // Get retention periods from application settings
    const settings = await ApplicationSettings.findOne({ tenantOwner: tenantId });

    const retentionPeriods = {
      SmsLog: settings?.logRetentionDays?.sms || 180,
      DiagnosticLog: settings?.logRetentionDays?.diagnostic || 90,
      UserDowntimeLog: settings?.logRetentionDays?.userDowntime || 180,
      TrafficLog: settings?.logRetentionDays?.traffic || 60,
    };
    console.log(`[${new Date().toISOString()}] Using retention periods:`, retentionPeriods);

    // Sequentially clean up each log collection
    await cleanupModel(SmsLog, 'SmsLog', retentionPeriods.SmsLog, tenantId);
    await cleanupModel(DiagnosticLog, 'DiagnosticLog', retentionPeriods.DiagnosticLog, tenantId);
    await cleanupTrafficLog(retentionPeriods.TrafficLog, tenantId);
    await cleanupModel(UserDowntimeLog, 'UserDowntimeLog', retentionPeriods.UserDowntimeLog, tenantId);

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
