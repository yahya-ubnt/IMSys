const RouterOSAPI = require('node-routeros').RouterOSAPI;
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MIKROTIK_HOST = process.env.MIKROTIK_HOST;
const MIKROTIK_USERNAME = process.env.MIKROTIK_USERNAME;
const MIKROTIK_PASSWORD = process.env.MIKROTIK_PASSWORD;
const MIKROTIK_PORT = parseInt(process.env.MIKROTIK_PORT, 10); // Ensure port is a number

async function testConnection() {
    console.log(`Attempting to connect to MikroTik at ${MIKROTIK_HOST}:${MIKROTIK_PORT} with user ${MIKROTIK_USERNAME}`);
    let connection;
    try {
        connection = new RouterOSAPI({
            host: MIKROTIK_HOST,
            user: MIKROTIK_USERNAME,
            password: MIKROTIK_PASSWORD,
            port: MIKROTIK_PORT,
        });

        await connection.connect();
        console.log('Successfully connected to MikroTik!');
        await connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('Failed to connect to MikroTik:', error.message);
        if (error.errno) {
            console.error('Error code:', error.errno);
        }
    } finally {
        if (connection && connection.connected) { // Check if connection object exists and is connected before closing
            connection.close();
        }
    }
}

testConnection();
