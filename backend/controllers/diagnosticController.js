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
      const mikrotikUser = await MikrotikUser.findById(userId).populate('mikrotikRouter').populate('station');
      if (!mikrotikUser) throw new Error('Mikrotik User not found');
      if (mikrotikUser.user.toString() !== req.user._id.toString()) throw new Error('Not authorized to run diagnostics for this Mikrotik user');

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
      const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, steps });
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
      const mikrotikUser = await MikrotikUser.findById(userId).populate('mikrotikRouter').populate('station');
      if (!mikrotikUser) return res.status(404).json({ message: 'Mikrotik User not found' });
      if (mikrotikUser.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized to run diagnostics for this Mikrotik user' });

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

      const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, steps });
      res.status(200).json(log);
    } catch (error) {
      console.error('Diagnostic Error:', error);
      res.status(500).json({ message: error.message || 'An unknown error occurred.' });
    }
  }
});

// --- Diagnostic Paths Helpers ---

const runCpeDiagnosticPath = async (addStep, mikrotikUser) => {
  const cpe = mikrotikUser.station;
  const router = mikrotikUser.mikrotikRouter;

  // 1. CPE (Station) Check
  if (!cpe) {
    addStep('CPE Check', 'Warning', 'No CPE (station) is associated with this client.');
    return; // Cannot proceed with this path
  }
  const isCPEOnline = await checkCPEStatus(cpe, router);
  if (!isCPEOnline) {
    addStep('CPE Check', 'Failure', `The client's CPE "${cpe.deviceName}" (${cpe.ipAddress}) is offline.`);
  } else {
    addStep('CPE Check', 'Success', `The client's CPE "${cpe.deviceName}" (${cpe.ipAddress}) is online.`);
  }

  // 2. AP (Access Point) Check
  const ap = await Device.findOne({ deviceType: 'Access', ssid: cpe.ssid, router: router._id });
  if (!ap) {
    addStep('AP Check', 'Warning', `No Access Point found with the same SSID (${cpe.ssid}) as the CPE.`);
  } else {
    const isAPOnline = await checkCPEStatus(ap, router);
    const apStatus = isAPOnline ? 'Success' : 'Failure';
    const apSummary = isAPOnline ? `Access Point "${ap.deviceName}" (${ap.ipAddress}) is online.` : `Access Point "${ap.deviceName}" (${ap.ipAddress}) is offline.`;
    addStep('AP Check', apStatus, apSummary);
  }

  // 3. Station-Based Neighbor Analysis
  const stationNeighbors = await MikrotikUser.find({ station: cpe._id });
  await performNeighborAnalysis(addStep, stationNeighbors, router, 'Station-Based', mikrotikUser._id);
};

const runApartmentDiagnosticPath = async (addStep, mikrotikUser) => {
  const apartmentNeighbors = await MikrotikUser.find({ 
    apartment_house_number: mikrotikUser.apartment_house_number,
    user: mikrotikUser.user 
  });
  await performNeighborAnalysis(addStep, apartmentNeighbors, mikrotikUser.mikrotikRouter, 'Apartment-Based', mikrotikUser._id);
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
    const logs = await DiagnosticLog.find({ user: req.user._id, mikrotikUser: userId }).sort({ createdAt: -1 });
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
    const log = await DiagnosticLog.findById(logId);

    if (!log) {
        res.status(404);
        throw new Error('Diagnostic log not found');
    }

    if (log.user.toString() !== req.user._id.toString() || log.mikrotikUser.toString() !== userId) {
        res.status(403);
        throw new Error('Not authorized to view this diagnostic log');
    }

    res.status(200).json(log);
});

module.exports = {
  runDiagnostic,
  getDiagnosticHistory,
  getDiagnosticLogById,
};
