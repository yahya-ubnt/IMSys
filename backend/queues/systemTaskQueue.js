const { Queue } = require('bullmq');

const redisConnection = {
  host: 'redis',
  port: 6379,
};

const systemTaskQueue = new Queue('System-Tasks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

module.exports = systemTaskQueue;
