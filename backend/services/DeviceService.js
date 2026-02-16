
const Device = require('../models/Device');
const DowntimeLog = require('../models/DowntimeLog');
const MikrotikRouter = require('../models/MikrotikRouter');
const { sanitizeString } = require('../utils/sanitization');
const { checkCPEStatus } = require('../utils/mikrotikUtils');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');

const DeviceService = {
  /**
   * Creates a new device after performing necessary validations.
   * @param {Object} deviceData - Data for the new device.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Device>} The created device document.
   */
  createDevice: async (deviceData, tenantId) => {
    const { router, macAddress, deviceName, deviceModel, loginUsername, loginPassword, ssid, wirelessPassword } = deviceData;

    // Verify ownership of the router
    const parentRouter = await MikrotikRouter.findOne({ _id: router, tenant: tenantId });
    if (!parentRouter) {
      const error = new Error('Router not found');
      error.statusCode = 404;
      throw error;
    }

    const deviceExists = await Device.findOne({ macAddress, tenant: tenantId });
    if (deviceExists) {
      const error = new Error('Device with this MAC address already exists');
      error.statusCode = 400;
      throw error;
    }

    const device = new Device({
      ...deviceData,
      deviceName: sanitizeString(deviceName),
      deviceModel: sanitizeString(deviceModel),
      loginUsername: sanitizeString(loginUsername),
      loginPassword,
      ssid: sanitizeString(ssid),
      wirelessPassword,
      tenant: tenantId,
    });

    const createdDevice = await device.save();
    return createdDevice;
  },

  /**
   * Retrieves a list of devices based on query parameters.
   * @param {String} tenantId - The ID of the tenant.
   * @param {Object} queryParams - Query parameters (e.g., deviceType).
   * @returns {Promise<Array<Device>>} A list of device documents.
   */
  getDevices: async (tenantId, queryParams) => {
    const query = { tenant: tenantId };
    if (queryParams.deviceType) {
      query.deviceType = queryParams.deviceType;
    }

    const devices = await Device.find(query)
      .populate('router', 'name ipAddress')
      .sort({ deviceType: 1 });
    return devices;
  },

  /**
   * Retrieves a single device by ID.
   * @param {String} deviceId - The ID of the device.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Device>} The device document.
   */
  getDeviceById: async (deviceId, tenantId) => {
    const query = { _id: deviceId, tenant: tenantId };
    const device = await Device.findOne(query)
      .populate('router', 'name ipAddress')
      .populate('physicalBuilding', 'name');

    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    let responseDevice = device.toObject();

    if (responseDevice.deviceType === 'Access' && responseDevice.ssid) {
      const connectedStations = await Device.find({ deviceType: 'Station', ssid: responseDevice.ssid, tenant: tenantId });
      responseDevice.connectedStations = connectedStations;
    } else if (responseDevice.deviceType === 'Station' && responseDevice.ssid) {
      const connectedAccessPoint = await Device.findOne({ deviceType: 'Access', ssid: responseDevice.ssid, tenant: tenantId });
      responseDevice.connectedAccessPoint = connectedAccessPoint;
    }
    return responseDevice;
  },

  /**
   * Updates an existing device.
   * @param {String} deviceId - The ID of the device to update.
   * @param {Object} updateData - The data to update the device with.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Device>} The updated device document.
   */
  updateDevice: async (deviceId, updateData, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId });
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    // Update fields
    device.router = updateData.router || device.router;
    device.ipAddress = updateData.ipAddress || device.ipAddress;
    device.macAddress = updateData.macAddress || device.macAddress;
    device.deviceType = updateData.deviceType || device.deviceType;
    device.physicalBuilding = updateData.physicalBuilding || device.physicalBuilding;
    device.serviceArea = updateData.serviceArea || device.serviceArea;
    device.parentId = updateData.parentId || device.parentId;
    device.deviceName = updateData.deviceName ? sanitizeString(updateData.deviceName) : device.deviceName;
    device.deviceModel = updateData.deviceModel ? sanitizeString(updateData.deviceModel) : device.deviceModel;
    device.loginUsername = updateData.loginUsername ? sanitizeString(updateData.loginUsername) : device.loginUsername;
    device.ssid = updateData.ssid ? sanitizeString(updateData.ssid) : device.ssid;

    if (updateData.loginPassword) {
      device.loginPassword = updateData.loginPassword;
    }
    if (updateData.wirelessPassword) {
      device.wirelessPassword = updateData.wirelessPassword;
    }

    const updatedDevice = await device.save();
    return updatedDevice;
  },

  /**
   * Deletes a device and its associated downtime logs.
   * @param {String} deviceId - The ID of the device to delete.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Object>} Success message.
   */
  deleteDevice: async (deviceId, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId });
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    await DowntimeLog.deleteMany({ device: device._id });
    await device.deleteOne();
    return { message: 'Device and associated downtime logs removed' };
  },

  /**
   * Retrieves downtime logs for a specific device.
   * @param {String} deviceId - The ID of the device.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Array<DowntimeLog>>} A list of downtime logs.
   */
  getDeviceDowntimeLogs: async (deviceId, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId });
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }
    const logs = await DowntimeLog.find({ device: device._id }).sort({ downStartTime: -1 });
    return logs;
  },

  /**
   * Performs a live ping check on a device via a core router.
   * @param {String} deviceId - The ID of the device to ping.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Object>} Object with success status and reachability.
   */
  pingDevice: async (deviceId, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId });
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    const coreRouter = await MikrotikRouter.findOne({ tenant: tenantId, isCoreRouter: true });
    if (!coreRouter) {
      const error = new Error('No core router is configured for this tenant to perform the check.');
      error.statusCode = 400;
      throw error;
    }

    const isOnline = await checkCPEStatus(device, coreRouter);
    return { success: true, status: isOnline ? 'Reachable' : 'Unreachable' };
  },

  /**
   * Enables Netwatch monitoring for a device by adding a job to the sync queue.
   * @param {String} deviceId - The ID of the device to enable monitoring for.
   * @param {String} tenantId - The ID of the tenant.
   * @returns {Promise<Object>} Success message.
   */
  enableMonitoring: async (deviceId, tenantId) => {
    const device = await Device.findOne({ _id: deviceId, tenant: tenantId });
    if (!device) {
      const error = new Error('Device not found');
      error.statusCode = 404;
      throw error;
    }

    await mikrotikSyncQueue.add('enableNetwatch', { 
      deviceId: device._id,
      tenantId: tenantId 
    });

    return { success: true, message: 'Monitoring injection queued successfully.' };
  },
};

module.exports = DeviceService;
