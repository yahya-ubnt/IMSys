const { Queue } = require('bullmq');

// The connection object points to the Redis service defined in docker-compose.yml
const redisConnection = {
  host: 'redis',
  port: 6379,
};

/**
 * The MikroTik-Sync queue.
 * This queue handles all jobs that require interaction with MikroTik routers,
 * such as creating, updating, or disconnecting users.
 * It's designed for high priority and includes retry logic for network instability.
 */
const mikrotikSyncQueue = new Queue('MikroTik-Sync', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5, // Retry a job up to 5 times if it fails
    backoff: {
      type: 'exponential',
      delay: 10000, // Start with a 10-second delay
    },
  },
});

module.exports = mikrotikSyncQueue;
