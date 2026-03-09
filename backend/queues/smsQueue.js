const { Queue } = require('bullmq');

// The connection object points to the Redis service defined in docker-compose.yml
const redisConnection = {
  host: 'redis',
  port: 6379,
};

/**
 * The SMS queue.
 * This queue handles all jobs related to sending SMS messages.
 * It's designed for reliability and includes retry logic for network or provider issues.
 */
const smsQueue = new Queue('SMS', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry a job up to 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with a 5-second delay
    },
  },
});

module.exports = smsQueue;
