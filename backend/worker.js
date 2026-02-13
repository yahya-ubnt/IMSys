const mikrotikSyncWorker = require('./workers/mikrotikSyncWorker');
const diagnosticWorker = require('./workers/diagnosticWorker');

// Start the worker
mikrotikSyncWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

mikrotikSyncWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

console.log('MikroTik Sync Worker process started.');
