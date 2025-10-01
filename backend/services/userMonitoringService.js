const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikUser = require('../models/MikrotikUser');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay

async function checkUserOnlineStatus(user, client) {
    let isOnline = false;
    const router = user.mikrotikRouter;

    if (!router) {
        console.warn(`[${new Date().toISOString()}] User ${user.username} has no associated router. Skipping status check.`);
        return false;
    }

    // Assumes client is already connected
    if (user.serviceType === 'pppoe') {
        const pppActive = await client.write('/ppp/active/print');
        isOnline = pppActive.some(session => session.name === user.username);
    } else if (user.serviceType === 'static') {
        if (user.ipAddress) {
            const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']);
            isOnline = pingReplies.some(reply => !reply.status);
        }
    }
    return isOnline;
}

async function performUserStatusCheck() {
    console.log(`[${new Date().toISOString()}] Performing user status check...`);

    try {
        const userIds = await MikrotikUser.find({}).select('_id');

        if (userIds.length === 0) {
            console.log(`[${new Date().toISOString()}] No MikroTik users found in the database.`);
            return;
        }

        for (const userId of userIds) {
            // Step 2: Fetch the fresh user object right before the check
            const user = await MikrotikUser.findById(userId).populate('mikrotikRouter').lean();

            if (!user || !user.mikrotikRouter) {
                console.warn(`[${new Date().toISOString()}] User with ID ${userId} or their router not found. Skipping.`);
                continue;
            }

            console.log(`[${new Date().toISOString()}] Checking status for user ${user.username} with IP ${user.ipAddress}`);

            const wasOnline = user.isOnline;
            let isOnline = false;
            let attempts = 0;

            const client = new RouterOSAPI({
                host: user.mikrotikRouter.ipAddress,
                user: user.mikrotikRouter.apiUsername,
                password: decrypt(user.mikrotikRouter.apiPassword),
                port: user.mikrotikRouter.apiPort,
                timeout: 2000,
            });

            try {
                await client.connect();

                while (attempts < RETRY_ATTEMPTS) {
                    attempts++;
                    try {
                        isOnline = await checkUserOnlineStatus(user, client);
                        if (isOnline) {
                            console.log(`[${new Date().toISOString()}] User ${user.username} is ONLINE (Attempt ${attempts}/${RETRY_ATTEMPTS}).`);
                            break;
                        } else {
                            console.warn(`[${new Date().toISOString()}] User ${user.username} is OFFLINE (Attempt ${attempts}/${RETRY_ATTEMPTS}).`);
                        }
                    } catch (err) {
                        console.error(`[${new Date().toISOString()}] Error during check attempt for ${user.username}:`, err);
                        isOnline = false; // Ensure status is offline on error
                    }

                    if (!isOnline && attempts < RETRY_ATTEMPTS) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Failed to connect to router for user ${user.username}.`, error);
                isOnline = false; // Cannot check, assume offline
            } finally {
                if (client.connected) {
                    client.close();
                }
            }

            // Update user status in database
            await MikrotikUser.findByIdAndUpdate(user._id, {
                isOnline: isOnline,
                lastChecked: new Date(),
            });
            console.log(`[${new Date().toISOString()}] Updated status for user ${user.username} to ${isOnline ? 'ONLINE' : 'OFFLINE'}.`);

            // Downtime Logging
            if (wasOnline && !isOnline) {
                // User went offline
                console.log(`[${new Date().toISOString()}] User ${user.username} went offline. Logging downtime.`);
                const newDowntime = new UserDowntimeLog({
                    user: user._id,
                    downStartTime: new Date(),
                });
                await newDowntime.save();
            } else if (!wasOnline && isOnline) {
                // User came back online
                console.log(`[${new Date().toISOString()}] User ${user.username} came back online. Updating downtime log.`);
                const openDowntime = await UserDowntimeLog.findOne({
                    user: user._id,
                    downEndTime: null,
                }).sort({ downStartTime: -1 });

                if (openDowntime) {
                    openDowntime.downEndTime = new Date();
                    openDowntime.durationSeconds = Math.floor((openDowntime.downEndTime - openDowntime.downStartTime) / 1000);
                    await openDowntime.save();
                }
            }
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during user status check loop:`, error);
    }
}

let userMonitoringInterval = null;

function startUserMonitoring(intervalMs) {
    if (userMonitoringInterval) {
        console.log(`[${new Date().toISOString()}] User monitoring already running. Clearing existing interval.`);
        clearInterval(userMonitoringInterval);
    }
    console.log(`[${new Date().toISOString()}] Starting user monitoring every ${intervalMs / 1000} seconds.`);
    // Perform an initial check immediately
    performUserStatusCheck();
    // Then set up the interval
    userMonitoringInterval = setInterval(performUserStatusCheck, intervalMs);
}

function stopUserMonitoring() {
    if (userMonitoringInterval) {
        console.log(`[${new Date().toISOString()}] Stopping user monitoring.`);
        clearInterval(userMonitoringInterval);
        userMonitoringInterval = null;
    }
}

module.exports = {
    startUserMonitoring,
    stopUserMonitoring,
    performUserStatusCheck // Export for immediate manual trigger if needed
};
