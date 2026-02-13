const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser.js');
const DiagnosticLog = require('../models/DiagnosticLog.js');
const { checkRouterStatus, checkUserStatus, checkCPEStatus, getMikrotikApiClient } = require('../utils/mikrotikUtils');
const Device = require('../models/Device.js');

// @desc    Run a new diagnostic check for a user
// @route   POST /api/v1/users/:userId/diagnostics
// @access  Private
const runDiagnostic = asyncHandler(async (req, res) => {
  const { stream = true } = req.body;

  if (stream) {
    // --- STREAMING LOGIC ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const steps = [];
    const addStep = (stepName, status, summary, details = {}) => {
      const step = { stepName, status, summary, details };
      steps.push(step);
      sendEvent('step', step);
    };

    const run = async () => {
      sendEvent('start', { message: 'Diagnostic process initiated...' });
      const { userId } = req.params;
      const mikrotikUser = await MikrotikUser.findOne({ _id: userId, tenant: req.user.tenant })
        .populate('mikrotikRouter')
        .populate('station')
        .populate('building');
      if (!mikrotikUser) throw new Error('Mikrotik User not found');

      const isExpired = new Date() > new Date(mikrotikUser.expiryDate);
      addStep('Billing Check', isExpired ? 'Failure' : 'Success', isExpired ? `Client account expired on ${new Date(mikrotikUser.expiryDate).toLocaleDateString()}.` : 'Client account is active.');

      const router = mikrotikUser.mikrotikRouter;
      if (!router) {
        addStep('Mikrotik Router Check', 'Failure', 'No Mikrotik router is associated with this client.');
      } else {
        const isRouterOnline = await checkRouterStatus(router);
        addStep('Mikrotik Router Check', isRouterOnline ? 'Success' : 'Failure', `Router "${router.name}" (${router.ipAddress}) is ${isRouterOnline ? 'online' : 'offline'}.`);
        if (isRouterOnline) {
          const isClientOnline = await checkUserStatus(mikrotikUser, router);
          addStep('Client Status Check', isClientOnline ? 'Success' : 'Failure', `Client "${mikrotikUser.username}" is ${isClientOnline ? 'online' : 'offline'}.`);

          if (mikrotikUser.station) await runCpeDiagnosticPath(addStep, mikrotikUser);
          if (mikrotikUser.apartment_house_number) await runApartmentDiagnosticPath(addStep, mikrotikUser);
        }
      }
      const log = await DiagnosticLog.create({ tenant: req.user.tenant, mikrotikUser: userId, steps });
      sendEvent('done', log);
    };

    run().catch(error => {
      console.error('Diagnostic Error:', error);
      sendEvent('error', { message: error.message || 'An unknown error occurred.' });
    }).finally(() => res.end());

  } else {
    // --- NON-STREAMING LOGIC ---
    try {
      const steps = [];
      const addStep = (stepName, status, summary, details = {}) => steps.push({ stepName, status, summary, details });

      const { userId } = req.params;
      const mikrotikUser = await MikrotikUser.findOne({ _id: userId, tenant: req.user.tenant })
        .populate('mikrotikRouter')
        .populate('station')
        .populate('building');
      if (!mikrotikUser) return res.status(404).json({ message: 'Mikrotik User not found' });

      const isExpired = new Date() > new Date(mikrotikUser.expiryDate);
      addStep('Billing Check', isExpired ? 'Failure' : 'Success', isExpired ? `Client account expired on ${new Date(mikrotikUser.expiryDate).toLocaleDateString()}.` : 'Client account is active.');

      const router = mikrotikUser.mikrotikRouter;
      if (!router) {
        addStep('Mikrotik Router Check', 'Failure', 'No Mikrotik router is associated with this client.');
      } else {
        const isRouterOnline = await checkRouterStatus(router);
        addStep('Mikrotik Router Check', isRouterOnline ? 'Success' : 'Failure', `Router "${router.name}" (${router.ipAddress}) is ${isRouterOnline ? 'online' : 'offline'}.`);
        if (isRouterOnline) {
          const isClientOnline = await checkUserStatus(mikrotikUser, router);
          addStep('Client Status Check', isClientOnline ? 'Success' : 'Failure', `Client "${mikrotikUser.username}" is ${isClientOnline ? 'online' : 'offline'}.`);

          if (mikrotikUser.station) await runCpeDiagnosticPath(addStep, mikrotikUser);
          if (mikrotikUser.apartment_house_number) await runApartmentDiagnosticPath(addStep, mikrotikUser);
        }
      }

      const log = await DiagnosticLog.create({ tenant: req.user.tenant, mikrotikUser: userId, steps });
      res.status(200).json(log);
    } catch (error) {
      console.error('Diagnostic Error:', error);
      res.status(500).json({ message: error.message || 'An unknown error occurred.' });
    }
  }
});

// --- Diagnostic Paths Helpers ---

const runCpeDiagnosticPath = async (addStep, mikrotikUser) => {
  const station = mikrotikUser.station;
  const router = mikrotikUser.mikrotikRouter;

  if (!station) {
    addStep('Hardware Check', 'Warning', 'No network station (CPE) is linked to this user.');
    return;
  }

  // Use a recursive helper to walk up the tree
  await walkHardwareTree(addStep, station, router, mikrotikUser.tenant);
  
  // Station-Based Neighbor Analysis
  const stationNeighbors = await MikrotikUser.find({ station: station._id, tenant: mikrotikUser.tenant });
  await performNeighborAnalysis(addStep, stationNeighbors, router, 'Station-Based', mikrotikUser._id);
};

const walkHardwareTree = async (addStep, device, router, tenantId) => {
  const isOnline = await checkCPEStatus(device, router);
  const status = isOnline ? 'Success' : 'Failure';
  const summary = `${device.deviceType} "${device.deviceName}" (${device.ipAddress}) is ${isOnline ? 'online' : 'offline'}.`;
  
  addStep(`${device.deviceType} Check`, status, summary);

  if (!isOnline && device.parentId) {
    // If the device is offline, check its parent to find the root cause
    const parent = await Device.findOne({ _id: device.parentId, tenant: tenantId });
    if (parent) {
      console.log(`[Diagnostic] Device ${device.deviceName} is offline. Checking parent ${parent.deviceName}...`);
      await walkHardwareTree(addStep, parent, router, tenantId);
    }
  }
};

const runApartmentDiagnosticPath = async (addStep, mikrotikUser) => {
  const building = mikrotikUser.building;

  if (!building) {
    addStep('Location Check', 'Warning', 'No physical building is linked to this user.');
    return;
  }

  const buildingNeighbors = await MikrotikUser.find({ 
    building: building._id,
    tenant: mikrotikUser.tenant 
  });
  
  await performNeighborAnalysis(addStep, buildingNeighbors, mikrotikUser.mikrotikRouter, 'Building-Based', mikrotikUser._id);
};

const performNeighborAnalysis = async (addStep, neighbors, router, analysisType, targetUserId) => {
  if (neighbors.length <= 1) { // <= 1 because the target user is in the list
    addStep(`Neighbor Analysis (${analysisType})`, 'Success', 'No other clients found for this analysis.');
    return;
  }

  const neighborResults = [];
  for (const neighbor of neighbors) {
    if (neighbor._id.toString() === targetUserId.toString()) continue;

    const isOnline = await checkUserStatus(neighbor, router);
    const isExpired = neighbor.expiryDate < new Date();
    const accountStatus = isExpired ? 'Expired' : 'Active';
    let reason = 'N/A';

    if (!isOnline) {
      reason = isExpired ? `Account expired on ${neighbor.expiryDate.toLocaleDateString()}` : 'Network/Hardware Issue';
    }

    neighborResults.push({
      name: neighbor.officialName,
      isOnline,
      accountStatus,
      reason,
    });
  }

  const summary = `Analyzed ${neighborResults.length} other user(s) in the same ${analysisType === 'Station-Based' ? 'station' : 'building'}.`;
  addStep(`Neighbor Analysis (${analysisType})`, 'Success', summary, { neighbors: neighborResults });
};


// @desc    Get diagnostic history for a user
// @route   GET /api/v1/users/:userId/diagnostics
// @access  Private
const getDiagnosticHistory = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const logs = await DiagnosticLog.find({ tenant: req.user.tenant, mikrotikUser: userId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
});

// @desc    Get a single diagnostic log by ID
// @route   GET /api/v1/users/:userId/diagnostics/:logId
// @access  Private
const getDiagnosticLogById = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, logId } = req.params;
    const log = await DiagnosticLog.findOne({ _id: logId, tenant: req.user.tenant, mikrotikUser: userId });

    if (!log) {
        res.status(404);
        throw new Error('Diagnostic log not found');
    }

    res.status(200).json(log);
});

module.exports = {
  runDiagnostic,
  getDiagnosticHistory,
  getDiagnosticLogById,
};
