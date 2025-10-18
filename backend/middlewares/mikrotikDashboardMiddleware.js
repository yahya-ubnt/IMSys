const asyncHandler = require('express-async-handler');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

const connectToRouter = asyncHandler(async (req, res, next) => {
  const router = await MikrotikRouter.findById(req.params.routerId);

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  // Check for ownership
  if (router.tenantOwner.toString() !== req.user.tenantOwner.toString()) {
    res.status(401);
    throw new Error('Not authorized to access this router');
  }

  let decryptedPassword;
  try {
    decryptedPassword = decrypt(router.apiPassword);
  } catch (e) {
    console.error('Failed to decrypt router password:', e);
    res.status(500);
    throw new Error('Could not decrypt router password. Please check settings.');
  }

  const client = new RouterOSAPI({
    host: router.ipAddress,
    user: router.apiUsername,
    password: decryptedPassword,
    port: router.apiPort,
    timeout: 5000, // 5-second timeout
  });

  try {
    await client.connect();
    console.log(`Successfully connected to router: ${router.name}`);
    req.mikrotikClient = client; // Attach client to the request object

    // Ensure the connection is closed after the response is sent
    res.on('finish', () => {
      if (client.connected) {
        client.close();
        console.log(`Connection to router ${router.name} closed.`);
      }
    });

    next();
  } catch (error) {
    console.error(`Failed to connect to MikroTik router ${router.name}:`, error);
    res.status(500);
    throw new Error(`Could not connect to router: ${router.name}`);
  }
});

module.exports = { connectToRouter };