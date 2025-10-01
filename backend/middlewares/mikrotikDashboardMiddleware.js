const asyncHandler = require('express-async-handler');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { RouterOSClient } = require('routeros-client');

const connectToRouter = asyncHandler(async (req, res, next) => {
  let client; // Declare client here
  try {
    const router = await MikrotikRouter.findById(req.params.routerId);

    if (!router) {
      res.status(404);
      throw new Error('Router not found');
    }

    let decryptedPassword;
    try {
      decryptedPassword = decrypt(router.apiPassword);
    } catch (parseError) {
      console.error('Error parsing or decrypting password:', parseError);
      res.status(500);
      throw new Error('Failed to decrypt router password. Ensure it is correctly encrypted.');
    }

    try {
        console.log(`Connecting to MikroTik router: ${router.name} (${router.ipAddress}:${router.apiPort})`);
        console.log(`Using username: ${router.apiUsername}`);
        console.log('Middleware: Client object before connect', client);
        client = new RouterOSClient({
            host: router.ipAddress,
            port: router.apiPort,
            user: router.apiUsername,
            password: decryptedPassword,
            timeout: 30, // seconds (increased for debugging)
        });
        await client.connect();
        console.log('Middleware: Client object after connect (if successful)', client);
        req.client = client;
        client.on('error', (err) => {
            console.error('RouterOSClient Error Event:', err);
        });
        next();
    } catch (error) {
        console.error(`RouterOSClient Connection Error for ${router.name} (${router.ipAddress}):`, error.message);
        return res.status(500).json({
            message: `Failed to connect to MikroTik router: ${router.name}`,
            error: error.message,
        });
    } finally { // Added finally block
        if (client && client.connected) { // Ensure client exists and is connected before closing
            client.close();
        }
    }
  } catch (outerError) {
    console.error('An unexpected error occurred in connectToRouter middleware:', outerError);
    if (!res.headersSent) {
      res.status(500).json({ message: 'An unexpected server error occurred.', error: outerError.message });
    }
  }
});

module.exports = { connectToRouter };