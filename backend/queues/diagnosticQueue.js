const Queue = require('bull');
const { REDIS_URL } = require('../config/env');

const diagnosticQueue = new Queue('diagnostic-queue', REDIS_URL);

module.exports = { diagnosticQueue };
