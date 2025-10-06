const asyncHandler = require('express-async-handler');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const { encrypt } = require('../utils/crypto'); // Import encrypt function
const RouterOSAPI = require('node-routeros').RouterOSAPI;
// Mikrotik API client will be integrated here later
// const MikrotikAPI = require('mikrotik'); // Example

// @desc    Create a new Mikrotik Router
// @route   POST /api/mikrotik/routers
// @access  Private
const createMikrotikRouter = asyncHandler(async (req, res) => {
  const { name, ipAddress, apiUsername, apiPassword, apiPort, location } = req.body;

  if (!name || !ipAddress || !apiUsername || !apiPassword || !apiPort) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  const routerExists = await MikrotikRouter.findOne({ ipAddress });

  if (routerExists) {
    res.status(400);
    throw new Error('Router with this IP address already exists');
  }

  const encryptedPassword = encrypt(apiPassword);

  const router = await MikrotikRouter.create({
    name,
    ipAddress,
    apiUsername,
    apiPassword: encryptedPassword, // Save the encrypted password
    apiPort,
    location,
    user: req.user._id, // Associate with the logged-in user
  });

  if (router) {
    res.status(201).json({
      _id: router._id,
      name: router.name,
      ipAddress: router.ipAddress,
      apiUsername: router.apiUsername,
      apiPort: router.apiPort,
      location: router.location,
    });
  } else {
    res.status(400);
    throw new Error('Invalid router data');
  }
});

// @desc    Get all Mikrotik Routers
// @route   GET /api/mikrotik/routers
// @access  Private
const getMikrotikRouters = asyncHandler(async (req, res) => {
  const routers = await MikrotikRouter.find({ user: req.user._id });
  res.status(200).json(routers);
});

// @desc    Get single Mikrotik Router by ID
// @route   GET /api/mikrotik/routers/:id
// @access  Private
const getMikrotikRouterById = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findById(req.params.id);

  if (router) {
    // Check for ownership
    if (router.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this router');
    }
    res.status(200).json(router);
  } else {
    res.status(404);
    throw new Error('Router not found');
  }
});

// @desc    Update a Mikrotik Router
// @route   PUT /api/mikrotik/routers/:id
// @access  Private
const updateMikrotikRouter = asyncHandler(async (req, res) => {
  const { name, ipAddress, apiUsername, apiPassword, apiPort, location } = req.body;

  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  // Check for ownership
  if (router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this router');
  }

  // Handle password update separately if provided
  if (apiPassword) {
    router.apiPassword = encrypt(apiPassword); // Encrypt the new password
  }

  router.name = name || router.name;
  router.ipAddress = ipAddress || router.ipAddress;
  router.apiUsername = apiUsername || router.apiUsername;
  router.apiPort = apiPort || router.apiPort;
  router.location = location || router.location;

  const updatedRouter = await router.save();

  res.status(200).json({
    _id: updatedRouter._id,
    name: updatedRouter.name,
    ipAddress: updatedRouter.ipAddress,
    apiUsername: updatedRouter.apiUsername,
    apiPort: updatedRouter.apiPort,
    location: updatedRouter.location,
  });
});

// @desc    Delete a Mikrotik Router
// @route   DELETE /api/mikrotik/routers/:id
// @access  Private
const deleteMikrotikRouter = asyncHandler(async (req, res) => {
  console.log(`Attempting to delete router with ID: ${req.params.id}`); // Log the ID

  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    console.log(`Router with ID: ${req.params.id} not found.`); // Log if not found
    res.status(404);
    throw new Error('Router not found');
  }

  // Check for ownership
  if (router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this router');
  }

  console.log(`Found router: ${router.name}. Attempting to delete associated users...`); // Log found router

  try {
    await MikrotikUser.deleteMany({ mikrotikRouter: router._id });
    console.log(`Associated users for router ID: ${req.params.id} successfully deleted.`); // Log user deletion success
  } catch (userDeleteError) {
    console.error(`Error deleting associated users for router ID: ${req.params.id}`, userDeleteError); // Log user deletion error
    res.status(500);
    throw new Error(`Failed to delete associated users: ${userDeleteError.message}`);
  }

  console.log(`Attempting to delete router itself with ID: ${req.params.id}...`); // Log router deletion attempt

  try {
    await MikrotikRouter.findByIdAndDelete(req.params.id);
    console.log(`Router with ID: ${req.params.id} successfully deleted.`); // Log router deletion success
    res.status(200).json({ message: 'Router removed successfully, and associated users deleted.' });
  } catch (routerDeleteError) {
    console.error(`Error deleting router with ID: ${req.params.id}`, routerDeleteError); // Log router deletion error
    res.status(500);
    throw new Error(`Failed to delete router: ${routerDeleteError.message}`);
  }
});

// @desc    Test connection to a Mikrotik Router
// @route   POST /api/mikrotik/routers/test-connection
// @access  Private
const testMikrotikConnection = asyncHandler(async (req, res) => {
  const { ipAddress, apiUsername, apiPassword, apiPort } = req.body;

  if (!ipAddress || !apiUsername || !apiPassword || !apiPort) {
    res.status(400);
    throw new Error('Please provide IP address, username, password, and port to test connection');
  }

  const client = new RouterOSAPI({
    host: ipAddress,
    user: apiUsername,
    password: apiPassword,
    port: apiPort,
    timeout: 5000, // 5 second timeout
  });

  try {
    await client.connect();
    // Run a simple command to ensure the connection is authenticated
    await client.write('/system/resource/print');
    await client.close();
    res.status(200).json({ message: 'Connection successful' });
  } catch (error) {
    console.error('Mikrotik connection test failed:', error);
    // Try to close the connection if it was opened
    try { await client.close(); } catch (e) { /* ignore */ }
    res.status(500).json({ message: `Connection failed: ${error.message}` });
  }
});

// @desc Get Mikrotik PPP Profiles
// @route GET /api/mikrotik-routers/:id/ppp-profiles
// @access Private
const getMikrotikPppProfiles = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    res.status(404);
    throw new Error('Mikrotik Router not found');
  }

  // Check for ownership
  if (router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to access this router');
  }

  let client;
  try {
    const { decrypt } = require('../utils/crypto'); // Import decrypt function

    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword), // Decrypt the password
      port: router.apiPort,
    });

    await client.connect();
    const pppProfiles = await client.write('/ppp/profile/print');
    res.json(pppProfiles.map(profile => profile.name));
  } catch (error) {
    console.error(`Mikrotik API Error (PPP Profiles): ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch PPP profiles from Mikrotik', error: error.message });
  } finally {
    if (client) {
      client.close();
    }
  }
});

// @desc Get PPP Services from a Mikrotik Router
// @route GET /api/mikrotik/routers/:id/ppp-services
// @access Private
const getMikrotikPppServices = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    res.status(404);
    throw new Error('Mikrotik Router not found');
  }

  // Check for ownership
  if (router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to access this router');
  }

  let client;
  try {
    const { decrypt } = require('../utils/crypto'); // Import decrypt function

    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword), // Decrypt the password
      port: router.apiPort,
    });

    await client.connect();
    // In RouterOS, PPP "services" are typically fixed types (e.g., pppoe, pptp, l2tp).
    // There isn't a direct API command to list these types dynamically.
    // We will return a hardcoded list of common PPP service types.
    const commonPppServices = ['any', 'async', 'l2tp', 'ovpn', 'pppoe', 'pptp', 'sstp'];
    res.json(commonPppServices);
  } catch (error) {
    console.error(`Mikrotik API Error (PPP Services): ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch PPP services from Mikrotik', error: error.message });
  } finally {
    if (client) {
      client.close();
    }
  }
});

// @desc    Get Mikrotik Router Status
// @route   GET /api/mikrotik/routers/:id/status
// @access  Private
const getMikrotikRouterStatus = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findById(req.params.id);

  if (!router) {
    res.status(404);
    throw new Error('Mikrotik Router not found');
  }

  // Check for ownership
  if (router.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to access this router');
  }

  let client;
  try {
    const { decrypt } = require('../utils/crypto');

    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: router.apiPort,
      timeout: 5000, // 5 second timeout
    });

    await client.connect();
    await client.write('/system/resource/print');
    await client.close();
    res.status(200).json({ status: 'online' });
  } catch (error) {
    try { await client.close(); } catch (e) { /* ignore */ }
    res.status(200).json({ status: 'offline' });
  }
});

module.exports = {
  createMikrotikRouter,
  getMikrotikRouters,
  getMikrotikRouterById,
  updateMikrotikRouter,
  deleteMikrotikRouter,
  testMikrotikConnection,
  getMikrotikPppProfiles,
  getMikrotikPppServices,
  getMikrotikRouterStatus,
};