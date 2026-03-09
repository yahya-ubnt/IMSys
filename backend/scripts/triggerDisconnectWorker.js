// This script is a bridge between the legacy master scheduler and the new BullMQ system.
// It finds all active tenants and queues a 'disconnectExpiredUsers' job for each one.

const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const scheduledTaskQueue = require('../queues/scheduledTaskQueue');

const triggerDisconnects = async () => {
  console.log('Connecting to database...');
  await connectDB();

  try {
    console.log('Finding active tenants...');
    const tenants = await Tenant.find({ status: 'Active' });
    console.log(`Found ${tenants.length} active tenants.`);

    for (const tenant of tenants) {
      await scheduledTaskQueue.add('disconnectExpiredUsers', { tenantId: tenant._id });
      console.log(`Queued 'disconnectExpiredUsers' job for tenant: ${tenant.name} (${tenant._id})`);
    }

    console.log('All disconnection jobs have been queued successfully.');
  } catch (error) {
    console.error('Error queueing disconnection jobs:', error);
    process.exit(1);
  } finally {
    // BullMQ recommends not closing the Redis connection manually in short-lived scripts.
    // The script will exit and the connection will close automatically.
    console.log('Script finished.');
    process.exit(0);
  }
};

triggerDisconnects();
