

const RouterOSAPI = require('node-routeros').RouterOSAPI;
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function disconnectExpiredClients() {
    console.log(`[${new Date().toISOString()}] Starting disconnectExpiredClients script...`);

    let connection;
    try {
        await connectDB(); // Connect to MongoDB
        console.log(`[${new Date().toISOString()}] Connected to MongoDB.`);

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to beginning of today for comparison

        // 1. Identify Expired Clients from MongoDB
        const expiredUsers = await MikrotikUser.find({
            expiryDate: { $lte: currentDate },
            isSuspended: false,
        }).populate('mikrotikRouter'); // Populate router details to get connection info

        if (expiredUsers.length === 0) {
            console.log(`[${new Date().toISOString()}] No expired and unsuspended clients found in the database.`);
            return;
        }

        console.log(`[${new Date().toISOString()}] Found ${expiredUsers.length} expired and unsuspended clients in the database.`);

        for (const user of expiredUsers) {
            console.log(`[${new Date().toISOString()}] Processing user: ${user.username} (ID: ${user._id})`);

            let connection;
            try {
                // Connect to the specific MikroTik router for this user
                const router = user.mikrotikRouter;
                if (!router) {
                    console.error(`[${new Date().toISOString()}] Error: MikroTik router not found for user ${user.username}. Skipping.`);
                    continue;
                }

                connection = new RouterOSAPI({
                    host: router.ipAddress,
                    user: router.apiUsername,
                    password: decrypt(router.apiPassword), // Use decrypt here
                    port: router.apiPort,
                });

                await connection.connect();
                console.log(`[${new Date().toISOString()}] Connected to MikroTik router: ${router.ipAddress}`);

                if (user.serviceType === 'pppoe') {
                    const pppSecret = await connection.write('/ppp/secret/print', [`?name=${user.username}`]);
                    if (pppSecret.length > 0) {
                        const secretId = pppSecret[0]['.id'];

                        // i. Terminate Active Session
                        const allActiveSessions = await connection.write('/ppp/active/print');
                        console.log(`[${new Date().toISOString()}] All active sessions from MikroTik:`, allActiveSessions);
                        const activeSessions = allActiveSessions.filter(session => session.name === user.username);
                        if (activeSessions.length > 0) {
                            for (const session of activeSessions) {
                                console.log(`[${new Date().toISOString()}] Attempting to remove active session with ID: ${session['.id']} for user ${user.username}.`);
                                await connection.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
                                console.log(`[${new Date().toISOString()}] Terminated active session for ${user.username} (ID: ${session['.id']}).`);
                            }
                        } else {
                            console.log(`[${new Date().toISOString()}] No active session found for ${user.username}.`);
                        }

                        // ii. Disable User Account
                        await connection.write('/ppp/secret/set', ['=.id=' + secretId, '=disabled=yes']);
                        console.log(`[${new Date().toISOString()}] Disabled user account for ${user.username}.`);

                        // iii. Assign "Disconnect" Profile
                        await connection.write('/ppp/secret/set', ['=.id=' + secretId, '=profile=Disconnect']);
                        console.log(`[${new Date().toISOString()}] Assigned 'disconnect' profile to ${user.username}.`);
                    } else {
                        console.log(`[${new Date().toISOString()}] PPP secret not found for ${user.username}.`);
                    }
                } else if (user.serviceType === 'static') {
                    const simpleQueues = await connection.write('/queue/simple/print', [`?name=${user.username}`]);
                    if (simpleQueues.length > 0) {
                        const queueId = simpleQueues[0]['.id'];
                        const setQueueResponse = await connection.write('/queue/simple/set', [`=.id=${queueId}`, '=max-limit=1k/1k']);
                        console.log(`[${new Date().toISOString()}] MikroTik API Response for static user ${user.username} (set max-limit):`, setQueueResponse);
                        console.log(`[${new Date().toISOString()}] Set max-limit to 1k/1k for static user ${user.username}.`);
                    } else {
                        console.log(`[${new Date().toISOString()}] Simple queue not found for ${user.username}.`);
                    }
                }

                // Update user status in database
                await MikrotikUser.findByIdAndUpdate(user._id, { isSuspended: true });
                console.log(`[${new Date().toISOString()}] Updated user ${user.username} to suspended in database.`);

            } catch (userProcessError) {
                console.error(`[${new Date().toISOString()}] Error processing user ${user.username}:`, userProcessError);
            } finally {
                if (connection) {
                    connection.close();
                    console.log(`[${new Date().toISOString()}] Disconnected from MikroTik router for user ${user.username}.`);
                }
            }
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Script failed:`, error);
    } finally {
        if (connection) {
            connection.close();
            console.log(`[${new Date().toISOString()}] Disconnected from MikroTik router.`);
        }
        // Ensure the database connection is closed
        await mongoose.connection.close();
        console.log(`[${new Date().toISOString()}] MongoDB connection closed.`);
        console.log(`[${new Date().toISOString()}] disconnectExpiredClients script finished.`);
    }
}

// Execute the script
disconnectExpiredClients();