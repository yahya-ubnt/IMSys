// This script is a bridge between the legacy master scheduler and the new BullMQ system.
// It finds all active tenants and queues a 'generateMonthlyBilling' job for each one.

const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const scheduledTaskQueue = require('../queues/scheduledTaskQueue');

const triggerBilling = async () => {
  console.log('Connecting to database...');
  await connectDB();

  try {
    console.log('Finding active tenants...');
    const tenants = await Tenant.find({ status: 'Active' });
    console.log(`Found ${tenants.length} active tenants.`);

    for (const tenant of tenants) {
      await scheduledTaskQueue.add('generateMonthlyBilling', { tenantId: tenant._id });
      console.log(`Queued 'generateMonthlyBilling' job for tenant: ${tenant.name} (${tenant._id})`);
    }

    console.log('All monthly billing jobs have been queued successfully.');
  } catch (error) {
    console.error('Error queueing monthly billing jobs:', error);
    process.exit(1);
  } finally {
    console.log('Script finished.');
    process.exit(0);
  }
};

triggerBilling();
