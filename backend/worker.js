require('./config/env'); // Load environment variables

const scheduledTaskWorker = require('./workers/scheduledTaskWorker');
const mikrotikSyncWorker = require('./workers/mikrotikSyncWorker');
const diagnosticWorker = require('./workers/diagnosticWorker');
const smsWorker = require('./workers/smsWorker');

// Start the workers and log their events
scheduledTaskWorker.on('completed', (job) => {
  console.log(`Scheduled Task Job ${job.id} completed!`);
});

scheduledTaskWorker.on('failed', (job, err) => {
  console.error(`Scheduled Task Job ${job.id} failed with error ${err.message}`);
});

mikrotikSyncWorker.on('completed', (job) => {
  console.log(`MikroTik Sync Job ${job.id} completed!`);
});

mikrotikSyncWorker.on('failed', (job, err) => {
  console.error(`MikroTik Sync Job ${job.id} failed with error ${err.message}`);
});

smsWorker.on('completed', (job) => {
  console.log(`SMS Job ${job.id} completed!`);
});

smsWorker.on('failed', (job, err) => {
  console.error(`SMS Job ${job.id} failed with error ${err.message}`);
});

console.log('All worker processes started.');

require('./scripts/masterScheduler');
require('./scripts/startupDisconnect.js');


