const util = require('util');
const exec = util.promisify(require('child_process').exec);
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay

async function pingHost(ipAddress) {
    try {
        const { stdout, stderr } = await exec(`ping -c 1 ${ipAddress}`);
        return !stderr && stdout && stdout.includes('1 packets transmitted, 1 received');
    } catch (error) {
        return false;
    }
}

async function checkRouter(router) {
    let isOnline = false;
    let location = router.location || '';
    let attempts = 0;

    // Clean up previous status from location
    location = location.replace(/\s*\((API Unreachable|Offline)\)$/, '');

    while (attempts < RETRY_ATTEMPTS) {
        attempts++;
        let client = null;
        try {
            client = new RouterOSAPI({
                host: router.ipAddress,
                user: router.apiUsername,
                password: decrypt(router.apiPassword),
                port: router.apiPort,
                timeout: 2000,
            });

            // Handle any asynchronous errors that aren't caught by the connect() promise
            client.on('error', (err) => {
                console.warn(`[${new Date().toISOString()}] Asynchronous error for router ${router.name} (${router.ipAddress}): ${err.message}`);
            });

            await client.connect();
            isOnline = true;
            console.log(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) is ONLINE.`);
            break;
        } catch (error) {
            console.warn(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) connection failed on attempt ${attempts}/${RETRY_ATTEMPTS}: ${error.message}`);
            if (attempts < RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                const isPingable = await pingHost(router.ipAddress);
                if (isPingable) {
                    isOnline = true; // Still considered "online" as it's pingable
                    location += ' (API Unreachable)';
                    console.log(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) is UNREACHABLE (ping OK, API failed).`);
                } else {
                    isOnline = false;
                    location += ' (Offline)';
                    console.log(`[${new Date().toISOString()}] Router ${router.name} (${router.ipAddress}) is OFFLINE (ping failed).`);
                }
            }
        } finally {
            if (client) {
                client.close();
            }
        }
    }

    await MikrotikRouter.findByIdAndUpdate(router._id, {
        isOnline: isOnline,
        location: location,
        lastChecked: new Date(),
    });
    console.log(`[${new Date().toISOString()}] Updated status for router ${router.name}.`);
}

async function performRouterStatusCheck(tenant) {
    console.log(`[${new Date().toISOString()}] Performing router status check for tenant ${tenant}...`);

    try {
        const routers = await MikrotikRouter.find({ tenant });

        if (routers.length === 0) {
            console.log(`[${new Date().toISOString()}] No MikroTik routers found in the database for this tenant.`);
            return;
        }

        await Promise.all(routers.map(checkRouter));

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during router status check for tenant ${tenant}:`, error);
    }
}

let monitoringInterval = null;

function startRouterMonitoring(intervalMs) {
    if (monitoringInterval) {
        console.log(`[${new Date().toISOString()}] Router monitoring already running. Clearing existing interval.`);
        clearInterval(monitoringInterval);
    }
    console.log(`[${new Date().toISOString()}] Starting router monitoring every ${intervalMs / 1000} seconds.`);
    // This will be triggered by the master scheduler now
    // performRouterStatusCheck();
    // monitoringInterval = setInterval(performRouterStatusCheck, intervalMs);
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
    performRouterStatusCheck
};