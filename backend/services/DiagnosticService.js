
const MikrotikUser = require('../models/MikrotikUser.js');
const DiagnosticLog = require('../models/DiagnosticLog.js');
const { checkRouterStatus, checkUserStatus, checkCPEStatus } = require('../utils/mikrotikUtils');
const Device = require('../models/Device.js');
const MikrotikRouter = require('../models/MikrotikRouter'); // Needed for walkHardwareTree

// --- Diagnostic Paths Helpers (moved from controller) ---

const walkHardwareTree = async (addStep, device, router, tenantId) => {
  const isOnline = await checkCPEStatus(device, router);
  const status = isOnline ? 'Success' : 'Failure';
  const summary = `${device.deviceType} "${device.deviceName}" (${device.ipAddress}) is ${isOnline ? 'online' : 'offline'}.`;
  
  addStep(`${device.deviceType} Check`, status, summary);

  if (!isOnline && device.parentId) {
    const parent = await Device.findOne({ _id: device.parentId, tenant: tenantId });
    if (parent) {
      await walkHardwareTree(addStep, parent, router, tenantId);
    }
  }
};

const runCpeDiagnosticPath = async (addStep, mikrotikUser) => {
  const station = mikrotikUser.station;
  const router = mikrotikUser.mikrotikRouter;

  if (!station) {
    addStep('Hardware Check', 'Warning', 'No network station (CPE) is linked to this user.');
    return;
  }

  await walkHardwareTree(addStep, station, router, mikrotikUser.tenant);
  
  const stationNeighbors = await MikrotikUser.find({ station: station._id, tenant: mikrotikUser.tenant });
  await performNeighborAnalysis(addStep, stationNeighbors, router, 'Station-Based', mikrotikUser._id);
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
  if (neighbors.length <= 1) {
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


const DiagnosticService = {
  /**
   * Runs a diagnostic check for a user, optionally streaming results.
   * @param {String} userId - The ID of the MikrotikUser.
   * @param {String} tenantId - The ID of the tenant.
   * @param {Function} [sendEvent] - Optional callback for streaming events.
   * @returns {Promise<DiagnosticLog>} The created diagnostic log.
   */
  runDiagnostic: async (userId, tenantId, sendEvent = () => {}) => {
    const steps = [];
    const addStep = (stepName, status, summary, details = {}) => {
      const step = { stepName, status, summary, details };
      steps.push(step);
      sendEvent('step', step);
    };

    sendEvent('start', { message: 'Diagnostic process initiated...' });
    const mikrotikUser = await MikrotikUser.findOne({ _id: userId, tenant: tenantId })
      .populate('mikrotikRouter')
      .populate('station')
      .populate('building');
    if (!mikrotikUser) {
      const error = new Error('Mikrotik User not found');
      error.statusCode = 404;
      throw error;
    }

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
    const log = await DiagnosticLog.create({ tenant: tenantId, mikrotikUser: userId, steps });
    sendEvent('done', log);
    return log;
  },

  /**
   * Retrieves diagnostic history for a user.
   * @param {String} userId - The ID of the MikrotikUser.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Array<DiagnosticLog>>} A list of diagnostic logs.
   */
  getDiagnosticHistory: async (userId, tenantId) => {
    const logs = await DiagnosticLog.find({ tenant: tenantId, mikrotikUser: userId }).sort({ createdAt: -1 });
    return logs;
  },

  /**
   * Retrieves a single diagnostic log by ID.
   * @param {String} logId - The ID of the diagnostic log.
   * @param {String} userId - The ID of the MikrotikUser.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<DiagnosticLog>} The diagnostic log document.
   */
  getDiagnosticLogById: async (logId, userId, tenantId) => {
    const log = await DiagnosticLog.findOne({ _id: logId, tenant: tenantId, mikrotikUser: userId });
    if (!log) {
      const error = new Error('Diagnostic log not found');
      error.statusCode = 404;
      throw error;
    }
    return log;
  },

  /**
   * Recursively walks up the device hierarchy to find the root cause of an outage.
   * @param {string} deviceId The ID of the device that was initially reported as DOWN.
   * @param {string} tenantId The ID of the tenant who owns the device.
   * @returns {Promise<object>} An object containing the root cause device and the path taken.
   */
  verifyRootCause: async (deviceId, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId }).populate('parentId');

    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    if (!device.parentId) {
      return { rootCause: device, path: [device] };
    }

    const parent = device.parentId;

    const coreRouter = await MikrotikRouter.findOne({ tenant: tenantId, isCoreRouter: true });
    if (!coreRouter) {
        const error = new Error('Core router not found');
        error.statusCode = 404;
        throw error;
    }

    let isParentOnline = false;
    const THRESHOLD_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;

    for (let i = 0; i < THRESHOLD_ATTEMPTS; i++) {
      isParentOnline = await checkCPEStatus(parent, coreRouter);
      if (isParentOnline) break;
      
      if (i < THRESHOLD_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (isParentOnline) {
      return { rootCause: device, path: [parent, device] };
    } else {
      parent.status = 'DOWN';
      await parent.save();
      
      const result = await DiagnosticService.verifyRootCause(parent._id, tenantId);
      
      return { ...result, path: [device, ...result.path] };
    }
  },
};

module.exports = DiagnosticService;
