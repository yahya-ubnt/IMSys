const { Worker, Queue } = require('bullmq');
const connectDB = require('../config/db');
const Tenant = require('../models/Tenant');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');

// Connect to DB once for the worker
connectDB();

const redisConnection = {
  host: 'redis',
  port: 6379,
};

const macAddressDiscoveryQueue = new Queue('MAC-Address-Discovery', { connection: redisConnection });

/**
 * The MAC Address Discovery Worker
 * This worker runs on a schedule, finds users pending MAC address assignment,
 * and tries to match them with dynamic DHCP leases on the router.
 */
const macAddressDiscoveryWorker = new Worker('MAC-Address-Discovery', async (job) => {
  const { name: jobType } = job;

  console.log(`[${new Date().toISOString()}] MAC Address Discovery Worker: Processing job '${jobType}'`);

  if (jobType !== 'discoverMacAddresses') {
    console.warn(`[MAC Discovery] Unknown job type: ${jobType}`);
    return;
  }

  try {
    const pendingUsers = await MikrotikUser.find({
      status: 'pending_mac_assignment',
      serviceType: 'static',
    }).populate('mikrotikRouter');

    if (pendingUsers.length === 0) {
      console.log('[MAC Discovery] No users are pending MAC address assignment.');
      return;
    }

    // Group users by router to minimize connections
    const usersByRouter = pendingUsers.reduce((acc, user) => {
      if (user.mikrotikRouter) {
        const routerId = user.mikrotikRouter._id.toString();
        if (!acc[routerId]) {
          acc[routerId] = {
            router: user.mikrotikRouter,
            users: [],
          };
        }
        acc[routerId].users.push(user);
      }
      return acc;
    }, {});

    for (const routerId in usersByRouter) {
      const { router, users } = usersByRouter[routerId];
      let client;
      try {
        client = await getMikrotikApiClient(router);
        if (!client) {
          console.error(`[MAC Discovery] Failed to connect to router ${router.name} (${router.ipAddress}).`);
          continue;
        }

        const dynamicLeases = await client.write('/ip/dhcp-server/lease/print', ['?dynamic=true']);

        for (const user of users) {
          const matchingLease = dynamicLeases.find(lease => lease.address === user.ipAddress);

          if (matchingLease) {
            console.log(`[MAC Discovery] Found a match for user ${user.username} (${user.ipAddress}) -> MAC: ${matchingLease['mac-address']}`);
            
            user.macAddress = matchingLease['mac-address'];
            user.status = 'active';
            user.syncStatus = 'pending';
            await user.save();

            // Trigger a sync to make the lease static and grant internet access
            await mikrotikSyncQueue.add('syncUser', {
              mikrotikUserId: user._id,
              tenantId: user.tenant,
            });
          }
        }
      } catch (error) {
        console.error(`[MAC Discovery] Error processing router ${router.name}:`, error);
      } finally {
        if (client) {
          client.close();
        }
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] MAC Address Discovery Worker: Error processing job '${jobType}':`, error);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 1, // Process one router at a time
});

/**
 * Schedules the MAC address discovery job to run periodically.
 */
const setupMacAddressDiscoveryScheduler = async () => {
    const jobName = 'discoverMacAddresses';
    const repeatPattern = '* * * * *'; // Run every minute

    await macAddressDiscoveryQueue.add(jobName, {}, {
        jobId: jobName,
        repeat: {
        cron: repeatPattern,
        },
    });

    console.log(`[${new Date().toISOString()}] Scheduled repeatable job '${jobName}' to run every minute.`);
};

// Start the scheduler when the worker starts
setupMacAddressDiscoveryScheduler();

console.log(`[${new Date().toISOString()}] MAC Address Discovery Worker started.`);

module.exports = macAddressDiscoveryWorker;
