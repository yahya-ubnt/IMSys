const { Queue } = require('bullmq');

// The connection object points to the Redis service defined in docker-compose.yml
const redisConnection = {
  host: 'redis',
  port: 6379,
};

/**
 * The Scheduled-Tasks queue.
 * This queue acts as an orchestrator, holding high-level jobs triggered
 * by the master scheduler, such as disconnecting all expired users or sending
 * payment reminders for a tenant.
 */
const scheduledTaskQueue = new Queue('Scheduled-Tasks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with a 1-minute delay for orchestration jobs
    },
  },
});

module.exports = scheduledTaskQueue;
