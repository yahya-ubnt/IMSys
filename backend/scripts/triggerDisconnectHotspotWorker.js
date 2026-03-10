const scheduledTaskQueue = require('../queues/scheduledTaskQueue');

const triggerDisconnectHotspotWorker = async () => {
  try {
    console.log('Triggering disconnect for expired hotspot users...');
    await scheduledTaskQueue.add('disconnectExpiredHotspotUsers', {});
    console.log('Successfully queued disconnect job for expired hotspot users.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to trigger disconnect for expired hotspot users:', error);
    process.exit(1);
  }
};

triggerDisconnectHotspotWorker();
