const asyncHandler = require('express-async-handler');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { RouterOSClient } = require('node-routeros');

const connectToRouter = asyncHandler(async (req, res, next) => {
  const routerId = req.params.routerId;
  if (!routerId) {
    res.status(400);
    throw new Error('Router ID is required');
  }

  const router = await MikrotikRouter.findById(routerId);
  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  let decryptedPassword;
  try {
    decryptedPassword = decrypt(router.apiPassword);
  } catch (error) {
    res.status(500);
    throw new Error('Failed to decrypt router password. Check encryption key.');
  }

  const conn = new RouterOSClient({
    host: router.ipAddress,
    user: router.apiUsername,
    password: decryptedPassword,
    port: router.apiPort,
    timeout: 15 // seconds
  });

  try {
    const client = await conn.connect();
    req.mikrotik = client; // Attach the connected client to the request object
    res.on('finish', () => {
      conn.close(); // Ensure connection is closed when request is done
    });
    next();
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to connect to MikroTik router: ${error.message}`);
  }
});

module.exports = { connectToRouter };
