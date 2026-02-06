const { Queue } = require('bullmq');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue'); // Import the main queue
const Tenant = require('../models/Tenant'); // Import Tenant model
const connectDB = require('../config/db'); // Import DB connection

// Connect to DB once for the job scheduler
connectDB();

/**
 * This function sets up a repeatable job that schedules the full reconciliation
 * of MikroTik states for each active tenant.
 * It runs periodically (e.g., every 15 minutes).
 */
const setupReconciliationScheduler = async () => {
  const jobName = 'scheduleReconciliation';
  const repeatPattern = '*/15 * * * *'; // Run every 15 minutes

  await mikrotikSyncQueue.add(jobName, {}, {
    jobId: jobName, // Ensure only one such repeatable job exists
    repeat: {
      cron: repeatPattern,
    },
  });

  console.log(`[${new Date().toISOString()}] Scheduled repeatable job '${jobName}' to run every 15 minutes.`);
};

// This is the processor for the 'scheduleReconciliation' job type.
// It will be run by a worker listening to the 'mikrotikSyncQueue'.
// Its responsibility is to find all active tenants and queue a 'reconcileMikrotikState' job for each.
const processReconciliationScheduler = async (job) => {
  console.log(`[${new Date().toISOString()}] Job: ${job.id} - Running reconciliation scheduler.`);

  try {
    const tenants = await Tenant.find({ status: 'active' }); // Find all active tenants

    for (const tenant of tenants) {
      console.log(`[${new Date().toISOString()}] Job: ${job.id} - Queuing 'reconcileMikrotikState' for tenant: ${tenant._id}`);
      await mikrotikSyncQueue.add('reconcileMikrotikState', {
        tenantId: tenant._id.toString(), // Pass tenant ID to the worker
      });
    }
    console.log(`[${new Date().toISOString()}] Job: ${job.id} - Finished queuing reconciliation for all active tenants.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Job: ${job.id} - Error in reconciliation scheduler:`, error);
    throw error;
  }
};

module.exports = {
  setupReconciliationScheduler,
  processReconciliationScheduler,
};
