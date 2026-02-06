const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const Package = require('../models/Package');
const { decrypt } = require('../utils/crypto');
const { getMikrotikApiClient } = require('../utils/mikrotikUtils'); // Assuming this utility exists
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue'); // Import the queue
const { processExpiredClientDisconnectScheduler } = require('../jobs/scheduleExpiredClientDisconnectsJob'); // Import the scheduler processor
const { processReconciliationScheduler } = require('../jobs/reconciliationJob'); // Import the reconciliation scheduler processor

// Connect to DB once for the worker
connectDB();

const mikrotikSyncWorker = new Worker('MikroTik-Sync', async (job) => {
  const { mikrotikUserId, tenantId, isManualDisconnect, reason } = job.data;
  const { name: jobType } = job;

  console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Processing job '${jobType}' for user ${mikrotikUserId || 'N/A'} (Tenant: ${tenantId || 'N/A'})`);

  let client;
  let user;
  let router;

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
      case 'addUser':
        // Logic to add user to MikroTik
        if (user.serviceType === 'pppoe') {
          const pppSecretArgs = [
            `=name=${user.username}`,
            `=password=${user.pppoePassword}`,
            `=profile=${user.package.profile}`,
            `=service=${user.serviceType}`,
          ];
          if (user.remoteAddress) {
            pppSecretArgs.push(`=remote-address=${user.remoteAddress}`);
          }
          await client.write('/ppp/secret/add', pppSecretArgs);
        } else if (user.serviceType === 'static') {
          await client.write('/queue/simple/add', [
            `=name=${user.username}`,
            `=target=${user.ipAddress}`,
            `=max-limit=${user.package.rateLimit}`,
          ]);
        }
        user.provisionedOnMikrotik = true;
        user.syncStatus = 'synced';
        user.syncErrorMessage = undefined; // Clear any previous errors
        await user.save();
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} added to MikroTik.`);
        break;

      case 'updateUser':
        // Logic to update user on MikroTik (e.g., package change)
        if (user.pendingPackage && user.pendingPackage.toString() !== user.package.toString()) {
          const newPackage = await Package.findById(user.pendingPackage);
          if (!newPackage) {
            throw new Error(`New package with ID ${user.pendingPackage} not found.`);
          }

          if (user.serviceType === 'pppoe') {
            const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
            if (pppSecrets.length > 0) {
              const secretId = pppSecrets[0]['.id'];
              await client.write('/ppp/secret/set', [`=.id=${secretId}`, `=profile=${newPackage.profile}`]);
            } else {
              throw new Error(`PPP Secret for user ${user.username} not found on MikroTik.`);
            }
          } else if (user.serviceType === 'static') {
            const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
            if (simpleQueues.length > 0) {
              const queueId = simpleQueues[0]['.id'];
              await client.write('/queue/simple/set', [`=.id=${queueId}`, `=max-limit=${newPackage.rateLimit}`]);
            } else {
              throw new Error(`Simple Queue for static user ${user.username} not found on MikroTik.`);
            }
          }
          user.package = user.pendingPackage; // Commit the package change
          user.pendingPackage = undefined; // Clear pending package
          user.syncStatus = 'synced';
          user.syncErrorMessage = undefined;
          await user.save();
          console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} package updated to ${newPackage.name}.`);
        } else {
          // Handle other potential updates if needed, or just mark as synced if no pending package
          user.syncStatus = 'synced';
          user.syncErrorMessage = undefined;
          await user.save();
          console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} marked as synced (no package change).`);
        }
        break;

      case 'disconnectUser':
        // Logic to disconnect user from MikroTik
        if (user.serviceType === 'pppoe') {
          const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
          if (pppSecrets.length > 0) {
            const secretId = pppSecrets[0]['.id'];
            // Terminate active session
            const allActiveSessions = await client.write('/ppp/active/print');
            const activeSessions = allActiveSessions.filter(session => session.name === user.username);
            for (const session of activeSessions) {
              await client.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
            }
            // Disable PPP secret and set profile to 'Disconnect'
            await client.write('/ppp/secret/set', [
              `=.id=${secretId}`,
              '=disabled=yes',
              '=profile=Disconnect',
              `=comment=${isManualDisconnect ? 'Manually disconnected' : 'Expired'} by system at ${new Date().toISOString()}`
            ]);
          } else {
            console.warn(`[${new Date().toISOString()}] MikroTik Sync Worker: PPP Secret for user ${user.username} not found on MikroTik. Marking as synced.`);
          }
        } else if (user.serviceType === 'static') {
          const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
          if (simpleQueues.length > 0) {
            const queueId = simpleQueues[0]['.id'];
            // Set max-limit to 1k/1k and disable the queue
            await client.write('/queue/simple/set', [
              `=.id=${queueId}`,
              '=max-limit=1k/1k',
              '=disabled=yes',
              `=comment=${isManualDisconnect ? 'Manually disconnected' : 'Expired'} by system at ${new Date().toISOString()}`
            ]);
          } else {
            console.warn(`[${new Date().toISOString()}] MikroTik Sync Worker: Simple Queue for static user ${user.username} not found on MikroTik. Marking as synced.`);
          }
        }
        user.isSuspended = true;
        user.isManuallyDisconnected = isManualDisconnect || false;
        user.syncStatus = 'synced';
        user.syncErrorMessage = undefined;
        await user.save();
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} disconnected from MikroTik.`);
        break;

      case 'connectUser':
        // Logic to connect user to MikroTik
        if (user.serviceType === 'pppoe') {
          const pppSecrets = await client.write('/ppp/secret/print', [`?name=${user.username}`]);
          if (pppSecrets.length > 0) {
            const secretId = pppSecrets[0]['.id'];
            // Enable PPP secret and set profile to the user's package profile
            await client.write('/ppp/secret/set', [
              `=.id=${secretId}`,
              '=disabled=no',
              `=profile=${user.package.profile}`,
              `=comment=Manually connected by system at ${new Date().toISOString()}`
            ]);
          } else {
            throw new Error(`PPP Secret for user ${user.username} not found on MikroTik.`);
          }
        } else if (user.serviceType === 'static') {
          const simpleQueues = await client.write('/queue/simple/print', [`?name=${user.username}`]);
          if (simpleQueues.length > 0) {
            const queueId = simpleQueues[0]['.id'];
            // Set max-limit to the user's package rate limit and enable the queue
            await client.write('/queue/simple/set', [
              `=.id=${queueId}`,
              `=max-limit=${user.package.rateLimit}`,
              '=disabled=no',
              `=comment=Manually connected by system at ${new Date().toISOString()}`
            ]);
          } else {
            throw new Error(`Simple Queue for static user ${user.username} not found on MikroTik.`);
          }
        }
        user.isSuspended = false;
        user.isManuallyDisconnected = false;
        user.syncStatus = 'synced';
        user.syncErrorMessage = undefined;
        await user.save();
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${user.username} connected to MikroTik.`);
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

            // Fetch all PPP secrets and simple queues from the router
            const routerPppSecrets = await routerClient.write('/ppp/secret/print');
            const routerSimpleQueues = await routerClient.write('/queue/simple/print');

            for (const dbUser of users) {
              let needsUpdate = false;
              let routerUserFound = false;

              if (dbUser.serviceType === 'pppoe') {
                const matchingSecret = routerPppSecrets.find(secret => secret.name === dbUser.username);
                if (matchingSecret) {
                  routerUserFound = true;
                  // Compare states
                  if (matchingSecret.disabled === 'yes' && !dbUser.isSuspended) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} is active, but disabled on router. Queuing connect job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('connectUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  } else if (matchingSecret.disabled === 'no' && dbUser.isSuspended) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} is suspended, but active on router. Queuing disconnect job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('disconnectUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  } else if (matchingSecret.profile !== dbUser.package.profile) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} has different package profile on router. Queuing update job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('updateUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  }
                } else {
                  // User in DB but not on Router
                  console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} not found on router. Queuing add job.`);
                  needsUpdate = true;
                  await mikrotikSyncQueue.add('addUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                }
              } else if (dbUser.serviceType === 'static') {
                const matchingQueue = routerSimpleQueues.find(queue => queue.name === dbUser.username);
                if (matchingQueue) {
                  routerUserFound = true;
                  // Compare states
                  const dbRateLimit = dbUser.package.rateLimit;
                  const routerRateLimit = matchingQueue['max-limit'];
                  if (matchingQueue.disabled === 'yes' && !dbUser.isSuspended) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} is active, but disabled on router. Queuing connect job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('connectUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  } else if (matchingQueue.disabled === 'no' && dbUser.isSuspended) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} is suspended, but active on router. Queuing disconnect job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('disconnectUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  } else if (routerRateLimit !== dbRateLimit) {
                    console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} has different rate limit on router. Queuing update job.`);
                    needsUpdate = true;
                    await mikrotikSyncQueue.add('updateUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                  }
                } else {
                  // User in DB but not on Router
                  console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Discrepancy: DB user ${dbUser.username} not found on router. Queuing add job.`);
                  needsUpdate = true;
                  await mikrotikSyncQueue.add('addUser', { mikrotikUserId: dbUser._id, tenantId: tenantId });
                }
              }

              if (!needsUpdate && dbUser.syncStatus !== 'synced') {
                // If no discrepancy found and DB status is not synced, mark as synced
                dbUser.syncStatus = 'synced';
                dbUser.syncErrorMessage = undefined;
                await dbUser.save();
                console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${dbUser.username} reconciled and marked as synced.`);
              }
            }

            // Identify users on Router but not in DB (Ghost users)
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
