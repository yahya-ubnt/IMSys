const { Queue } = require('bullmq');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue'); // Import the main queue
const Tenant = require('../models/Tenant'); // Import Tenant model
const connectDB = require('../config/db'); // Import DB connection

// Connect to DB once for the job scheduler
connectDB();

/**
 * This function sets up a repeatable job that schedules the disconnection
 * of expired clients for each active tenant.
 * It runs periodically (e.g., once a day).
 */
const setupExpiredClientDisconnectScheduler = async () => {
  const jobName = 'scheduleExpiredClientDisconnects';
  const repeatPattern = '0 0 * * *'; // Run once every day at midnight (UTC)

  // Add the repeatable job to the mikrotikSyncQueue
  // The processor for this job will be defined in a worker that listens to 'mikrotikSyncQueue'
  await mikrotikSyncQueue.add(jobName, {}, {
    jobId: jobName, // Ensure only one such repeatable job exists
    repeat: {
      cron: repeatPattern,
    },
  });

  console.log(`[${new Date().toISOString()}] Scheduled repeatable job '${jobName}' to run daily at midnight.`);
};

// This is the processor for the 'scheduleExpiredClientDisconnects' job type.
// It will be run by a worker listening to the 'mikrotikSyncQueue'.
// Its responsibility is to find all active tenants and queue a 'processExpiredClientsForTenant' job for each.
const processExpiredClientDisconnectScheduler = async (job) => {
  console.log(`[${new Date().toISOString()}] Job: ${job.id} - Running scheduler for expired client disconnects.`);

  try {
    const tenants = await Tenant.find({ status: 'active' }); // Find all active tenants

    for (const tenant of tenants) {
      console.log(`[${new Date().toISOString()}] Job: ${job.id} - Queuing 'processExpiredClientsForTenant' for tenant: ${tenant._id}`);
      await mikrotikSyncQueue.add('processExpiredClientsForTenant', {
        tenantId: tenant._id.toString(), // Pass tenant ID to the worker
      });
    }
    console.log(`[${new Date().toISOString()}] Job: ${job.id} - Finished queuing expired client processing for all active tenants.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Job: ${job.id} - Error in expired client disconnect scheduler:`, error);
    throw error;
  }
};

module.exports = {
  setupExpiredClientDisconnectScheduler,
  processExpiredClientDisconnectScheduler,
};
