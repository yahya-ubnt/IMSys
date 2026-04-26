const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const Device = require('../models/Device');
const Package = require('../models/Package');
const { decrypt } = require('../utils/crypto');
const { getMikrotikApiClient, injectNetwatchScript, removeNetwatchScript, injectPPPProfileScripts, syncMikrotikUser, removeHotspotIpBinding, removeMikrotikUser } = require('../utils/mikrotikUtils'); // Assuming this utility exists
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue'); // Import the queue
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
        device = await Device.findById(deviceId);
        if (!device) throw new Error(`Device ${deviceId} not found.`);
        router = await MikrotikRouter.findById(device.router);
        if (!router) throw new Error(`Router not found for device ${device.deviceName}`);
        
        await injectNetwatchScript(router, device);
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Netwatch injected for ${device.deviceName}`);
        break;

      case 'disableNetwatch':
        device = await Device.findById(deviceId);
        if (!device) throw new Error(`Device ${deviceId} not found.`);
        router = await MikrotikRouter.findById(device.router);
        if (!router) throw new Error(`Router not found for device ${device.deviceName}`);

        await removeNetwatchScript(router, device);
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Netwatch removed for ${device.deviceName}`);
        break;
    
      case 'updateNetwatch':
        try {
            const { deviceId, oldIpAddress } = job.data;
            const device = await Device.findById(deviceId);
            if (!device) {
                throw new Error(`Device not found for deviceId: ${deviceId}`);
            }
            const router = await MikrotikRouter.findById(device.router);
            if (!router) {
                throw new Error(`Router not found for device ${device.deviceName}`);
            }

            // Create a temporary device object with the old IP to remove the script
            const oldDevice = { ...device.toObject(), ipAddress: oldIpAddress };
            await removeNetwatchScript(router, oldDevice);

            // Inject the new script
            await injectNetwatchScript(router, device);
            console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Netwatch updated for ${device.deviceName}`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] MikroTik Sync Worker: Error processing updateNetwatch job for deviceId: ${job.data.deviceId}`, error);
            throw error;
        }
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

      case 'syncHotspotUser':
        const hotspotUserData = {
          username: user.hotspotName,
          password: user.hotspotPassword,
          server: user.server,
          profile: user.profile,
          timeLimit: '0', // Adjust if HotspotUser model gets time limits
          dataLimit: '0',
        };
        await ensureHotspotUser(client, hotspotUserData);
        user.syncStatus = 'synced';
        user.provisionedOnMikrotik = true;
        user.lastSyncedAt = new Date();
        await user.save();
        break;

      case 'syncVoucher':
        const Voucher = require('../models/Voucher');
        const voucher = await Voucher.findById(mikrotikUserId);
        if (!voucher) throw new Error('Voucher not found');
        
        const voucherData = {
          username: voucher.username,
          password: voucher.password,
          profile: voucher.profile,
          timeLimit: voucher.timeLimit || '0', // Vouchers often have time limits
          dataLimit: voucher.dataLimit || '0',
        };
        await ensureHotspotUser(client, voucherData);
        voucher.syncStatus = 'synced';
        voucher.provisionedOnMikrotik = true;
        voucher.lastSyncedAt = new Date();
        await voucher.save();
        break;

      case 'addHotspotIpBinding':
        const { macAddress: bindingMac, server: bindingServer } = job.data;
        await ensureHotspotIpBinding(client, bindingMac, bindingServer);
        console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: IP Binding ensured for ${bindingMac}`);
        break;

      case 'removeUser':
        const { routerId: removeRouterId, ...userToRemove } = job.data;
        if (!removeRouterId) {
          throw new Error('routerId is required for removeUser job');
        }
        const routerForRemoval = await MikrotikRouter.findById(removeRouterId);
        if (!routerForRemoval) {
          throw new Error(`Router not found for routerId: ${removeRouterId}`);
        }
        const removalClient = await getMikrotikApiClient(routerForRemoval);
        if (!removalClient) {
          throw new Error(`Failed to connect to MikroTik router ${routerForRemoval.ipAddress} for user removal.`);
        }
        try {
          await removeMikrotikUser(removalClient, userToRemove);
          console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: User ${userToRemove.username} removed from router successfully.`);
        } finally {
          if (removalClient) {
            removalClient.close();
          }
        }
        break;

      case 'removeHotspotUser':
        const { username: removeUsername, routerId: removeRouterId } = job.data;
        const routerForHotspotRemoval = await MikrotikRouter.findById(removeRouterId);
        if (routerForHotspotRemoval) {
          const hClient = await getMikrotikApiClient(routerForHotspotRemoval);
          if (hClient) {
            try {
              const hUsers = await hClient.runQuery('/ip/hotspot/user/print', { name: removeUsername });
              if (hUsers.length > 0) {
                await hClient.runQuery('/ip/hotspot/user/remove', { '.id': hUsers[0]['.id'] });
                console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Hotspot user ${removeUsername} removed successfully.`);
              }
            } finally {
              hClient.close();
            }
          }
        }
        break;

      case 'removeHotspotBinding':
        try {
            const { macAddress, routerId } = job.data;
            if (!macAddress || !routerId) {
                throw new Error('macAddress and routerId are required for removeHotspotBinding job');
            }
            const routerToRemove = await MikrotikRouter.findById(routerId);
            if (!routerToRemove) {
                throw new Error(`Router not found for routerId: ${routerId}`);
            }
            await removeHotspotIpBinding(routerToRemove, macAddress);
            console.log(`[${new Date().toISOString()}] MikroTik Sync Worker: Hotspot IP Binding removed for ${macAddress}`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] MikroTik Sync Worker: Error processing removeHotspotBinding job for macAddress: ${job.data.macAddress}`, error);
            throw error;
        }
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
                  const isSuspended = dbUser.status === 'suspended';
                  const desiredProfile = isSuspended ? 'Disconnect' : dbUser.package.profile;
                  const desiredDisabled = isSuspended ? 'yes' : 'no';
                  if (matchingSecret.profile !== desiredProfile || matchingSecret.disabled !== desiredDisabled || matchingSecret.password !== dbUser.pppoePassword) {
                    needsSync = true;
                  }
                }
              } else if (dbUser.serviceType === 'static') {
                const matchingQueue = routerSimpleQueues.find(queue => queue.name === dbUser.username);
                const isInAllowedList = routerAddressLists.some(listEntry => 
                  listEntry.address === dbUser.ipAddress && listEntry.list === 'ALLOWED_USERS'
                );
                const shouldBeAllowed = dbUser.status === 'active';

                if (!matchingQueue || isInAllowedList !== shouldBeAllowed || matchingQueue['max-limit'] !== dbUser.package.rateLimit) {
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
    } else if (mikrotikUserId && jobType === 'syncVoucher') {
      const Voucher = require('../models/Voucher');
      const voucher = await Voucher.findById(mikrotikUserId);
      if (voucher) {
        voucher.syncStatus = 'error';
        voucher.syncErrorMessage = error.message;
        await voucher.save();
      }
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
