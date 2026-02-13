const { Queue } = require('bullmq');
const { REDIS_URL } = require('../config/env');

const diagnosticQueue = new Queue('diagnostic-queue', {
  connection: {
    host: 'redis',
    port: 6379,
  },
});

module.exports = diagnosticQueue;
