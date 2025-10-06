const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const MikrotikUser = require('../models/MikrotikUser.js');
const MikrotikRouter = require('../models/MikrotikRouter.js');
const Device = require('../models/Device.js');
const DiagnosticLog = require('../models/DiagnosticLog.js');
const { decrypt } = require('../utils/crypto.js');
const RouterOSAPI = require('node-routeros').RouterOSAPI;
const { checkRouterStatus, checkUserStatus, checkCPEStatus } = require('../utils/mikrotikUtils');


// A helper function to add a step to the diagnostic log
const addStep = (steps, stepName, status, summary, details = {}) => {
  steps.push({ stepName, status, summary, details });
};


// @desc    Run a new diagnostic check for a user
// @route   POST /api/v1/users/:userId/diagnostics
// @access  Private
const runDiagnostic = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const steps = [];
    let finalConclusion = '';

    // 1. Fetch the Mikrotik user and ensure it belongs to the logged-in SaaS user
    const mikrotikUser = await MikrotikUser.findById(userId).populate('mikrotikRouter').populate('station');
    if (!mikrotikUser) {
        res.status(404);
        throw new Error('Mikrotik User not found');
    }
    if (mikrotikUser.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to run diagnostics for this Mikrotik user');
    }

    // STEP 1: Billing Check
    const isExpired = mikrotikUser.expiryDate < new Date();
    if (isExpired) {
        addStep(steps, 'Billing Check', 'Failure', `Client account expired on ${mikrotikUser.expiryDate.toLocaleDateString()}.`);
        finalConclusion = 'Client is offline due to an expired subscription.';
        
        const log = await DiagnosticLog.create({
            user: req.user._id, // SaaS user
            mikrotikUser: userId, // Mikrotik user
            router: mikrotikUser.mikrotikRouter?._id,
            cpeDevice: mikrotikUser.station?._id,
            steps,
            finalConclusion,
        });
        return res.status(200).json(log);
    }
    addStep(steps, 'Billing Check', 'Success', 'Client account is active.');

    // STEP 2: Mikrotik Router Check
    const router = mikrotikUser.mikrotikRouter;
    if (!router) {
        addStep(steps, 'Mikrotik Router Check', 'Failure', 'No Mikrotik router is associated with this client.');
        finalConclusion = 'Configuration error: Client is not linked to a router.';

        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, steps, finalConclusion });
        return res.status(200).json(log);
    }

    const isRouterOnline = await checkRouterStatus(router);
    if (!isRouterOnline) {
        addStep(steps, 'Mikrotik Router Check', 'Failure', `Router "${router.name}" (${router.ipAddress}) is offline.`);
        finalConclusion = `The core router "${router.name}" is offline, affecting all connected clients.`;

        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, steps, finalConclusion });
        return res.status(200).json(log);
    }
    addStep(steps, 'Mikrotik Router Check', 'Success', `Router "${router.name}" (${router.ipAddress}) is online.`);

    // STEP 3: Client Status Check
    const isClientOnline = await checkUserStatus(mikrotikUser, router);
    if (isClientOnline) {
        addStep(steps, 'Client Status Check', 'Success', 'Client is online and reachable.');
        finalConclusion = 'Client is online. No issues detected.';

        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, cpeDevice: mikrotikUser.station?._id, steps, finalConclusion });
        return res.status(200).json(log);
    }
    addStep(steps, 'Client Status Check', 'Failure', 'Client is offline.');

    // STEP 4: CPE (Station) Check
    const cpe = mikrotikUser.station;
    if (!cpe) {
        addStep(steps, 'CPE Check', 'Warning', 'No CPE (station) is associated with this client.');
        finalConclusion = 'Client is offline, but no CPE is linked to them to continue diagnosis.';
        
        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, steps, finalConclusion });
        return res.status(200).json(log);
    }

    const isCPEOnline = await checkCPEStatus(cpe, router);
    if (!isCPEOnline) {
        addStep(steps, 'CPE Check', 'Failure', `The client's CPE "${cpe.deviceName}" (${cpe.ipAddress}) is offline.`);
        finalConclusion = `The client's CPE is offline. This is likely a CPE power issue or a problem with the link to the router.`;

        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, cpeDevice: cpe._id, steps, finalConclusion });
        return res.status(200).json(log);
    }
    addStep(steps, 'CPE Check', 'Success', `The client's CPE "${cpe.deviceName}" (${cpe.ipAddress}) is online.`);

    // STEP 5: Neighbor Analysis
    const neighbors = await MikrotikUser.find({ station: cpe._id, _id: { $ne: userId } });
    if (neighbors.length === 0) {
        addStep(steps, 'Neighbor Analysis', 'Warning', 'No other clients are connected to this CPE.');
        finalConclusion = 'Client is offline. The issue is isolated to this client as their CPE is online and has no other users.';

        const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, cpeDevice: cpe._id, steps, finalConclusion });
        return res.status(200).json(log);
    }

    const onlineNeighbors = [];
    const offlineNeighbors = [];
    for (const neighbor of neighbors) {
        const isNeighborOnline = await checkUserStatus(neighbor, router);
        if (isNeighborOnline) {
            onlineNeighbors.push({ name: neighbor.officialName, phone: neighbor.mobileNumber });
        } else {
            offlineNeighbors.push({ name: neighbor.officialName, phone: neighbor.mobileNumber });
        }
    }

    const summary = `${onlineNeighbors.length} neighbor(s) online, ${offlineNeighbors.length} neighbor(s) offline.`;
    addStep(steps, 'Neighbor Analysis', 'Success', summary, { onlineNeighbors, offlineNeighbors });

    if (offlineNeighbors.length > 0) {
        finalConclusion = "Multiple clients on the same CPE are offline. This suggests a problem with the CPE or the switch/cabling at the client's building.";
    } else {
        finalConclusion = "Client is offline, but their CPE and all neighbors are online. The issue is isolated to this client's indoor wiring, router, or device.";
    }

    const log = await DiagnosticLog.create({ user: req.user._id, mikrotikUser: userId, router: router._id, cpeDevice: cpe._id, steps, finalConclusion });
    res.status(200).json(log);
});

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

module.exports = {
  runDiagnostic,
  getDiagnosticHistory,
};
