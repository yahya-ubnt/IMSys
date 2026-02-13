const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const Device = require('../models/Device');
const Package = require('../models/Package');
const { decrypt } = require('../utils/crypto');
const { getMikrotikApiClient, injectNetwatchScript, injectPPPProfileScripts } = require('../utils/mikrotikUtils'); // Assuming this utility exists
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue'); // Import the queue
const { processExpiredClientDisconnectScheduler } = require('../jobs/scheduleExpiredClientDisconnectsJob'); // Import the scheduler processor
const { processReconciliationScheduler } = require('../jobs/reconciliationJob'); // Import the reconciliation scheduler processor

// Connect to DB once for the worker
connectDB();

const mikrotikSyncWorker = new Worker('MikroTik-Sync', async (job) => {
  const { mikrotikUserId, deviceId, tenantId, isManualDisconnect, reason } = job.data;
  const { name: jobType } = job;

  console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Processing job '${jobType}' for user ${mikrotikUserId || 'N/A'} (Tenant: ${tenantId || 'N/A'})`);

  let client;
  let user;
  let router;
  let device;

  try {
    // For jobs that involve a specific user, fetch the user and router details
    if (mikrotikUserId) {
      user = await MikrotikUser.findById(mikrotikUserId).populate('mikrotikRouter').populate('package');
      if (!user) {
        throw new Error(`MikroTik User with ID ${mikrotikUserId} not found.`);
      }
      router = user.mikrotikRouter;
      if (!router) {
        throw new Error(`Associated MikroTik Router not found for user ${user.username}.`);
      }
      client = await getMikrotikApiClient(router);
      if (!client) {
        throw new Error(`Failed to connect to MikroTik router ${router.ipAddress}.`);
      }
    }

    switch (jobType) {
      case 'enableNetwatch':
        device = await Device.findById(deviceId).populate('router');
        if (!device) throw new Error(`Device ${deviceId} not found.`);
        router = device.router;
        if (!router) throw new Error(`Router not found for device ${device.deviceName}`);
        
        await injectNetwatchScript(router, device);
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Netwatch injected for ${device.deviceName}`);
        break;

      case 'addUser':
      case 'updateUser':
      case 'disconnectUser':
      case 'connectUser':
      case 'syncUser':
        // All user operations are now consolidated into an idempotent sync
        await syncMikrotikUser(client, user);
        
        user.provisionedOnMikrotik = true;
        user.syncStatus = 'synced';
        user.syncErrorMessage = undefined;
        user.lastSyncedAt = new Date();
        // Clear pending package if it was a package update
        if (user.pendingPackage && user.pendingPackage.toString() === user.package.toString()) {
            user.pendingPackage = undefined;
        }
        await user.save();
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} synced successfully.`);
        break;

      case 'scheduleExpiredClientDisconnects':
        // This job type is processed by the scheduler itself, which then adds
        // 'processExpiredClientsForTenant' jobs.
        // The logic for this is in processExpiredClientDisconnectScheduler.
        await processExpiredClientDisconnectScheduler(job);
        break;

      case 'processExpiredClientsForTenant':
        // Logic from the original disconnectExpiredClientsWorker.js
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const cursor = MikrotikUser.find({
          tenant: tenantId,
          expiryDate: { $lte: currentDate },
          isSuspended: false,
        }).cursor();

        await cursor.eachAsync(async (expiredUser) => {
          console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Found expired user: ${expiredUser.username} (ID: ${expiredUser._id}) for tenant ${tenantId}`);

          // Update user in DB to pending suspension
          expiredUser.isSuspended = true;
          expiredUser.syncStatus = 'pending';
          await expiredUser.save();

          // Add a job to the mikrotikSyncQueue to disconnect this specific user
          await mikrotikSyncQueue.add('disconnectUser', {
            mikrotikUserId: expiredUser._id,
            tenantId: tenantId,
            reason: 'expired',
          });
          console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Queued disconnect job for user: ${expiredUser.username}`);
        });
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Finished processing expired clients for tenant: ${tenantId}`);
        break;

      case 'scheduleReconciliation':
        await processReconciliationScheduler(job);
        break;

      case 'reconcileMikrotikState':
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Starting full reconciliation for tenant: ${tenantId}`);
        const dbUsers = await MikrotikUser.find({ tenant: tenantId }).populate('mikrotikRouter').populate('package');

        // Group users by router
        const usersByRouter = dbUsers.reduce((acc, user) => {
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
          let routerClient;
          try {
            routerClient = await getMikrotikApiClient(router);
            if (!routerClient) {
              console.error(`[${new Date().toISOString()}] MikroTik Sync Worker: Failed to connect to router ${router.ipAddress} for reconciliation.`);
              continue; // Skip this router
            }

            // Fetch all state data in bulk for efficiency
            const [routerPppSecrets, routerSimpleQueues, routerDhcpLeases, routerAddressLists, routerNetwatchRules] = await Promise.all([
              routerClient.write('/ppp/secret/print'),
              routerClient.write('/queue/simple/print'),
              routerClient.write('/ip/dhcp-server/lease/print'),
              routerClient.write('/ip/firewall/address-list/print'),
              routerClient.write('/tool/netwatch/print')
            ]);

            // --- 1. Reconcile Users (Identify Discrepancies) ---
            for (const dbUser of users) {
              let needsSync = false;

              if (dbUser.serviceType === 'pppoe') {
                const matchingSecret = routerPppSecrets.find(secret => secret.name === dbUser.username);
                if (!matchingSecret) {
                  needsSync = true;
                } else {
                  const desiredProfile = dbUser.isSuspended ? 'Disconnect' : dbUser.package.profile;
                  const desiredDisabled = dbUser.isSuspended ? 'yes' : 'no';
                  if (matchingSecret.profile !== desiredProfile || matchingSecret.disabled !== desiredDisabled || matchingSecret.password !== dbUser.pppoePassword) {
                    needsSync = true;
                  }
                }
              } else if (dbUser.serviceType === 'static') {
                const matchingQueue = routerSimpleQueues.find(queue => queue.name === dbUser.username);
                const isInBlockedList = routerAddressLists.some(listEntry => 
                  listEntry.address === dbUser.ipAddress && listEntry.list === 'BLOCKED_USERS'
                );
                const shouldBeBlocked = dbUser.isSuspended;

                if (!matchingQueue || isInBlockedList !== shouldBeBlocked || matchingQueue['max-limit'] !== dbUser.package.rateLimit) {
                  needsSync = true;
                }
              }

              if (needsSync) {
                console.log(`[Reconcile] User ${dbUser.username} is out of sync. Queuing syncUser job.`);
                await mikrotikSyncQueue.add('syncUser', { mikrotikUserId: dbUser._id, tenantId });
              } else if (dbUser.syncStatus !== 'synced') {
                dbUser.syncStatus = 'synced';
                dbUser.lastSyncedAt = new Date();
                await dbUser.save();
              }
            }

            // --- 2. Reconcile Configuration (The Healer) ---
            console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Starting configuration healing for router ${router.name}`);
            
            // A. Heal Device Monitoring (Netwatch)
            const dbDevices = await Device.find({ tenant: tenantId, router: router._id });
            for (const device of dbDevices) {
              const matchingNetwatch = routerNetwatchRules.find(rule => rule.host === device.ipAddress);
              
              // If netwatch rule is missing OR its comment doesn't start with 'IMSys Monitor', re-inject.
              if (!matchingNetwatch || !matchingNetwatch.comment?.startsWith('IMSys Monitor')) {
                console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Healing Device: ${device.deviceName}. Netwatch rule missing or incorrect. Re-injecting.`);
                await injectNetwatchScript(router, device);
              }
            }

            // B. Heal User Monitoring (PPP Profile Scripts)
            // This ensures profiles have the on-up/on-down scripts
            await injectPPPProfileScripts(router);

            // --- 3. Identify Ghost Users ---
            const dbUsernames = new Set(users.map(u => u.username));
            const ghostPppSecrets = routerPppSecrets.filter(secret => !dbUsernames.has(secret.name));
            const ghostSimpleQueues = routerSimpleQueues.filter(queue => !dbUsernames.has(queue.name));

            for (const ghostSecret of ghostPppSecrets) {
              console.warn(`[${new Date().toISOString()}] MikroTik Sync Worker: Warning: Ghost PPP user ${ghostSecret.name} found on router ${router.name} but not in DB. Manual intervention may be required.`);
              // TODO: Potentially add a job to remove this user from the router, or flag for admin review
            }
            for (const ghostQueue of ghostSimpleQueues) {
              console.warn(`[${new Date().toISOString()}] MikroTik Sync Worker: Warning: Ghost Static user ${ghostQueue.name} found on router ${router.name} but not in DB. Manual intervention may be required.`);
              // TODO: Potentially add a job to remove this user from the router, or flag for admin review
            }

          } catch (routerError) {
            console.error(`[${new Date().toISOString()}] MikroTik Sync Worker: Error during reconciliation for router ${router.name}:`, routerError);
            // Mark all users associated with this router as having a sync error
            for (const user of users) {
              user.syncStatus = 'error';
              user.syncErrorMessage = `Router connection failed during reconciliation: ${routerError.message}`;
              await user.save();
            }
          } finally {
            if (routerClient) {
              routerClient.close();
            }
          }
        }
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Finished full reconciliation for tenant: ${tenantId}`);
        break;

      default:
        console.warn(`[${new Date().toISOString()}] MikroTik Sync Worker: Unknown job type: ${jobType}`);
        break;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] MikroTik Sync Worker: Error processing job '${jobType}' for user ${mikrotikUserId || 'N/A'} (Tenant: ${tenantId || 'N/A'}):`, error);
    // Update user status to 'error' if a user-specific job failed
    if (user) {
      user.syncStatus = 'error';
      user.syncErrorMessage = error.message;
      await user.save();
    }
    throw error; // Re-throw to mark job as failed in BullMQ
  } finally {
    if (client) {
      client.close();
    }
  }
}, {
  connection: {
    host: 'redis',
    port: 6379,
  },
  // Add other worker options if needed, e.g., concurrency
});

console.log(`[${new Date().toISOString()}] MikroTik Sync Worker started.`);

module.exports = mikrotikSyncWorker;
