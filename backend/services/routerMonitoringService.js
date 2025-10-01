const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay

async function performRouterStatusCheck() {
    console.log(`[${new Date().toISOString()}] Performing router status check...`);

    try {
        const routers = await MikrotikRouter.find({});

        if (routers.length === 0) {
            console.log(`[${new Date().toISOString()}] No MikroTik routers found in the database.`);
            return;
        }

        for (const router of routers) {
            let isOnline = false;
            let attempts = 0;
            let client = null;

            while (attempts < RETRY_ATTEMPTS) {
                attempts++;
                try {
                    client = new RouterOSAPI({
                        host: router.ipAddress,
                        user: router.apiUsername,
                        password: decrypt(router.apiPassword),
                        port: router.apiPort,
                        timeout: 2000, // 2 second timeout for each attempt
                    });

                    await client.connect();
                    isOnline = true;
                    console.log(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) is ONLINE (Attempt ${attempts}/${RETRY_ATTEMPTS}).`);
                    break; // Exit retry loop on success
                } catch (error) {
                    console.warn(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) connection failed (Attempt ${attempts}/${RETRY_ATTEMPTS}): ${error.message}`);
                    console.error(`[${new Date().toISOString()}] Detailed error for ${router.name}:`, error);
                    if (attempts < RETRY_ATTEMPTS) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                } finally {
                    if (client) {
                        client.close();
                    }
                }
            }

            await MikrotikRouter.findByIdAndUpdate(router._id, {
                isOnline: isOnline,
                lastChecked: new Date(),
            });
            console.log(`[${new Date().toISOString()}] Updated status for router ${router.name} to ${isOnline ? 'ONLINE' : 'OFFLINE'}.`);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during router status check:`, error);
    }
}

let monitoringInterval = null;

function startRouterMonitoring(intervalMs) {
    if (monitoringInterval) {
        console.log(`[${new Date().toISOString()}] Router monitoring already running. Clearing existing interval.`);
        clearInterval(monitoringInterval);
    }
    console.log(`[${new Date().toISOString()}] Starting router monitoring every ${intervalMs / 1000} seconds.`);
    // Perform an initial check immediately
    performRouterStatusCheck();
    // Then set up the interval
    monitoringInterval = setInterval(performRouterStatusCheck, intervalMs);
}

function stopRouterMonitoring() {
    if (monitoringInterval) {
        console.log(`[${new Date().toISOString()}] Stopping router monitoring.`);
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
}

module.exports = {
    startRouterMonitoring,
    stopRouterMonitoring,
    performRouterStatusCheck // Export for immediate manual trigger if needed
};