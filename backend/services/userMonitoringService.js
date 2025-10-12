const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikUser = require('../models/MikrotikUser');
const UserDowntimeLog = require('../models/UserDowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { sendAlert } = require('../services/alertingService'); // Import sendAlert
const User = require('../models/User'); // Import User model

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
    console.log(`[${new Date().toISOString()}] Performing bulk user status check...`);

    try {
        // 1. Fetch all users and group them by router
        const allUsers = await MikrotikUser.find({}).populate('mikrotikRouter').lean();
        if (allUsers.length === 0) {
            console.log(`[${new Date().toISOString()}] No MikroTik users found.`);
            return;
        }

        const usersByRouter = allUsers.reduce((acc, user) => {
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

        // 2. Process each router group
        for (const routerId in usersByRouter) {
            const { router, users } = usersByRouter[routerId];
            console.log(`[${new Date().toISOString()}] Checking router ${router.name} (${router.ipAddress}) for ${users.length} users.`);

            const client = new RouterOSAPI({
                host: router.ipAddress,
                user: router.apiUsername,
                password: decrypt(router.apiPassword),
                port: router.apiPort,
                timeout: 5000, // Increased timeout for bulk operations
            });

            try {
                await client.connect();

                // 3. Fetch online user data in bulk
                const [pppActiveSessions, simpleQueues] = await Promise.all([
                    client.write('/ppp/active/print'),
                    client.write('/queue/simple/print')
                ]);

                const onlinePppoeUsers = new Set(pppActiveSessions.map(s => s.name));
                
                const potentiallyOfflineUsers = [];

                // 4. Initial online status check
                for (const user of users) {
                    let isOnline = false;
                    if (user.serviceType === 'pppoe') {
                        isOnline = onlinePppoeUsers.has(user.username);
                    } else if (user.serviceType === 'static') {
                        // For static users, we will do individual checks with retries if they appear offline
                        const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']);
                        isOnline = pingReplies.some(reply => !reply.status);
                    }

                    if (isOnline) {
                        if (!user.isOnline) {
                            // User came online
                            await MikrotikUser.findByIdAndUpdate(user._id, { isOnline: true, lastChecked: new Date() });
                            console.log(`[${new Date().toISOString()}] Updated status for user ${user.username} to ONLINE.`);
                            // Log downtime end
                            const openDowntime = await UserDowntimeLog.findOne({
                                mikrotikUser: user._id,
                                downEndTime: null,
                            }).sort({ downStartTime: -1 });

                                                if (openDowntime) {
                                                    openDowntime.downEndTime = new Date();
                                                    openDowntime.durationSeconds = Math.floor((openDowntime.downEndTime - openDowntime.downStartTime) / 1000);
                                                    await openDowntime.save();
                                                    console.log(`[${new Date().toISOString()}] User ${user.username} came back online. Updated downtime log.`);
                                                }
                                                // --- ADD ALERT HERE ---
                                                const adminUser = await User.findOne({ isAdmin: true }); // Assuming User model is available
                                                if (adminUser) {
                                                    await sendAlert({
                                                        username: user.username, // Using username for alert
                                                        ipAddress: user.ipAddress || 'N/A'
                                                    }, 'ONLINE', adminUser, 'User');
                                                }
                        }
                    } else {
                        if (user.isOnline) {
                            // User might be offline, add to potentially offline list for retry
                            potentiallyOfflineUsers.push(user);
                        }
                    }
                }

                // 5. Retry for potentially offline users
                for (const user of potentiallyOfflineUsers) {
                    let isStillOnline = false;
                    for (let i = 0; i < RETRY_ATTEMPTS; i++) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                        let isOnlineNow = false;
                        try {
                            if (user.serviceType === 'pppoe') {
                                const pppActive = await client.write('/ppp/active/print');
                                isOnlineNow = pppActive.some(session => session.name === user.username);
                            } else if (user.serviceType === 'static') {
                                const pingReplies = await client.write('/ping', [`=address=${user.ipAddress}`, '=count=2']);
                                isOnlineNow = pingReplies.some(reply => !reply.status);
                            }
                        } catch (err) {
                            console.error(`[${new Date().toISOString()}] Retry check failed for ${user.username}:`, err);
                        }

                        if (isOnlineNow) {
                            isStillOnline = true;
                            break;
                        }
                    }

                    if (!isStillOnline) {
                        // User is confirmed offline
                        await MikrotikUser.findByIdAndUpdate(user._id, { isOnline: false, lastChecked: new Date() });
                        console.log(`[${new Date().toISOString()}] Updated status for user ${user.username} to OFFLINE.`);
                        // Log downtime start
                        console.log(`[${new Date().toISOString()}] User ${user.username} went offline. Logging downtime.`);
                        const newDowntime = new UserDowntimeLog({
                            user: user.user,
                            mikrotikUser: user._id,
                            downStartTime: new Date(),
                        });
                        await newDowntime.save();
                        // --- ADD ALERT HERE ---
                        const adminUser = await User.findOne({ isAdmin: true });
                        if (adminUser) {
                            await sendAlert({
                                username: user.username,
                                ipAddress: user.ipAddress || 'N/A'
                            }, 'OFFLINE', adminUser, 'User');
                        }
                    }
                }

            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error processing router ${router.name}:`, error);
                // If router is unreachable, mark all users on it as offline
                for (const user of users) {
                    if (user.isOnline) {
                        await MikrotikUser.findByIdAndUpdate(user._id, { isOnline: false, lastChecked: new Date() });
                        console.log(`[${new Date().toISOString()}] Marked user ${user.username} as OFFLINE due to router connection error.`);
                        // Log downtime
                        console.log(`[${new Date().toISOString()}] User ${user.username} went offline. Logging downtime.`);
                        const newDowntime = new UserDowntimeLog({
                            user: user.user,
                            mikrotikUser: user._id,
                            downStartTime: new Date(),
                        });
                        await newDowntime.save();
                        // --- ADD ALERT HERE ---
                        const adminUser = await User.findOne({ isAdmin: true });
                        if (adminUser) {
                            await sendAlert({
                                username: user.username,
                                ipAddress: user.ipAddress || 'N/A'
                            }, 'OFFLINE (Router Unreachable)', adminUser, 'User');
                        }
                    }
                }
            } finally {
                if (client.connected) {
                    client.close();
                }
            }
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during bulk user status check:`, error);
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

