// backend/scripts/startupDisconnect.js

/**
 * This script runs on server startup to find and disconnect any users
 * whose subscriptions expired while the server was offline.
 */

const Tenant = require('../models/Tenant');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikUser = require('../models/MikrotikUser');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');

const runStartupDisconnect = async () => {
  console.log('Running startup disconnection check for expired users...');
  let processedUsers = 0;

  try {
    // Wait a few seconds for the main DB connection to be established
    await new Promise(resolve => setTimeout(resolve, 5000));

    const expiredUsers = await MikrotikUser.find({
      expiryDate: { $lt: new Date() },
      isSuspended: false,
    });

    if (expiredUsers.length === 0) {
      console.log('No expired users found needing disconnection.');
      return;
    }

    console.log(`Found ${expiredUsers.length} expired users to process.`);

    for (const user of expiredUsers) {
      try {
        user.isSuspended = true;
        await user.save();

        await mikrotikSyncQueue.add('disconnectUser', {
          mikrotikUserId: user._id,
          tenantId: user.tenant,
        });

        console.log(`- User ${user.username} (ID: ${user._id}) marked as suspended and queued for disconnection.`);
        processedUsers++;
      } catch (error) {
        console.error(`- Failed to process user ${user.username} (ID: ${user._id}):`, error);
      }
    }

    console.log(`Startup disconnection check completed. Processed ${processedUsers} users.`);
  } catch (error) {
    console.error('Error during startup disconnection check:', error);
  }
};

// Immediately invoke the function
runStartupDisconnect();
