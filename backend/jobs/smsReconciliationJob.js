const scheduledTaskQueue = require('../queues/scheduledTaskQueue');

const JOB_NAME = 'reconcileSmsStatus';
const CRON_SCHEDULE = '0 * * * *'; // Every hour at the 0th minute

/**
 * Sets up a repeatable job in the scheduledTaskQueue to run the SMS reconciliation task.
 */
const setupSmsReconciliationScheduler = async () => {
  try {
    // Remove any old instances of the job to prevent duplicates
    const repeatableJobs = await scheduledTaskQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.name === JOB_NAME) {
        await scheduledTaskQueue.removeRepeatableByKey(job.key);
      }
    }

    // Add the new repeatable job
    await scheduledTaskQueue.add(
      JOB_NAME,
      {}, // No data needed, it's a system-wide check
      {
        repeat: {
          cron: CRON_SCHEDULE,
        },
        jobId: JOB_NAME, // A unique ID for the repeatable job
      }
    );

    console.log(`[Scheduler] SMS Reconciliation job scheduled to run every hour.`);
  } catch (error) {
    console.error('Error setting up SMS reconciliation scheduler:', error);
  }
};

module.exports = { setupSmsReconciliationScheduler };
