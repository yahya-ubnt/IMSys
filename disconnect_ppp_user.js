const RouterOSAPI = require('node-routeros').RouterOSAPI;

// --- Configuration ---
const routerIp = 'YOUR_ROUTER_IP'; // e.g., '10.10.10.1'
const apiUsername = 'YOUR_API_USERNAME'; // e.g., 'billing'
const apiPassword = 'YOUR_API_PASSWORD'; // e.g., 'test123'
const apiPort = 8728; // Default API port for Mikrotik
const targetPppUsername = 'USER_TO_DISCONNECT'; // The username of the PPP client to disconnect

async function disconnectPppUser() {
    let client;
    try {
        client = new RouterOSAPI({
            host: routerIp,
            user: apiUsername,
            password: apiPassword,
            port: apiPort,
        });

        console.log(`Attempting to connect to Mikrotik router: ${routerIp}`);
        await client.connect();
        console.log(`Successfully connected to Mikrotik router: ${routerIp}`);

        console.log(`Searching for active PPP connection for user: ${targetPppUsername}`);
        const activePpp = await client.write('/ppp/active/print', [`?name=${targetPppUsername}`]);
        console.log(`Active PPP connections found:`, activePpp);

        if (activePpp.length > 0) {
            const connectionId = activePpp[0]['.id'];
            console.log(`Removing active PPP connection with ID: ${connectionId} for user: ${targetPppUsername}`);
            await client.write('/ppp/active/remove', [`=.id=${connectionId}`]);
            console.log(`Active PPP connection removed for user: ${targetPppUsername}`);
        } else {
            console.log(`No active PPP connection found for user: ${targetPppUsername}`);
        }
    } catch (error) {
        console.error(`Error disconnecting PPP user ${targetPppUsername}: ${error.message}`);
    } finally {
        if (client) {
            client.close();
            console.log(`Disconnected from Mikrotik router: ${routerIp}`);
        }
    }
}

disconnectPppUser();
