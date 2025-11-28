const asyncHandler = require('express-async-handler');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const { encrypt, decrypt } = require('../utils/crypto'); // Import encrypt and decrypt function
const { getHotspotServers: getServers, getHotspotProfiles: getProfiles } = require('../utils/mikrotikUtils');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

// @desc    Create a new Mikrotik Router
// @route   POST /api/mikrotik/routers
// @access  Private
const createMikrotikRouter = asyncHandler(async (req, res) => {
  const { name, ipAddress, apiUsername, apiPassword, apiPort, location } = req.body;

  if (!name || !ipAddress || !apiUsername || !apiPassword || !apiPort) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  const routerExists = await MikrotikRouter.findOne({ ipAddress, tenant: req.user.tenant });

  if (routerExists) {
    res.status(400);
    throw new Error('Router with this IP address already exists for this tenant');
  }

  const encryptedPassword = encrypt(apiPassword);

  const router = await MikrotikRouter.create({
    name,
    ipAddress,
    apiUsername,
    apiPassword: encryptedPassword, // Save the encrypted password
    apiPort,
    location,
    tenant: req.user.tenant, // Associate with the logged-in user's tenant
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
  const query = { tenant: req.user.tenant };
  const routers = await MikrotikRouter.find(query);
  res.status(200).json(routers);
});

// @desc    Get single Mikrotik Router by ID
// @route   GET /api/mikrotik/routers/:id
// @access  Private
const getMikrotikRouterById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };
  const router = await MikrotikRouter.findOne(query);

  if (router) {
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

  const router = await MikrotikRouter.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
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
  const router = await MikrotikRouter.findOne({ _id: req.params.id, tenant: req.user.tenant });

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  await MikrotikUser.deleteMany({ mikrotikRouter: router._id });
  await router.deleteOne();

  res.status(200).json({ message: 'Router and associated users removed successfully.' });
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
    await client.write('/system/resource/print');
    await client.close();
    res.status(200).json({ message: 'Connection successful' });
  } catch (error) {
    try { await client.close(); } catch (e) { /* ignore */ }
    res.status(500).json({ message: `Connection failed: ${error.message}` });
  }
});

// @desc Get Mikrotik PPP Profiles
// @route GET /api/mikrotik-routers/:id/ppp-profiles
// @access Private
const getMikrotikPppProfiles = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };
  const router = await MikrotikRouter.findOne(query);

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  let client;
  try {
    client = new RouterOSAPI({
      host: router.ipAddress,
      user: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: router.apiPort,
    });

    await client.connect();
    const pppProfiles = await client.write('/ppp/profile/print');
    res.json(pppProfiles.map(profile => profile.name));
  } catch (error) {
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
  const query = { _id: req.params.id, tenant: req.user.tenant };
  const router = await MikrotikRouter.findOne(query);

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  const commonPppServices = ['any', 'async', 'l2tp', 'ovpn', 'pppoe', 'pptp', 'sstp'];
  res.json(commonPppServices);
});

// @desc    Get Mikrotik Router Status
// @route   GET /api/mikrotik/routers/:id/status
// @access  Private
const getMikrotikRouterStatus = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, tenant: req.user.tenant };
  const router = await MikrotikRouter.findOne(query);

  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }

  let client;
  try {
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

const getHotspotServers = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }
  const servers = await getServers(router);
  res.json(servers);
});

const getHotspotProfiles = asyncHandler(async (req, res) => {
  const router = await MikrotikRouter.findOne({ _id: req.params.id, tenant: req.user.tenant });
  if (!router) {
    res.status(404);
    throw new Error('Router not found');
  }
  const profiles = await getProfiles(router);
  res.json(profiles);
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
  getHotspotServers,
  getHotspotProfiles,
};