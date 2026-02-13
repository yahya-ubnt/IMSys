const Device = require('../models/Device');
const MikrotikRouter = require('../models/MikrotikRouter');
const { checkCPEStatus } = require('../utils/mikrotikUtils');

/**
 * Recursively walks up the device hierarchy to find the root cause of an outage.
 * When a device goes down, this service checks its parent. If the parent is also down,
 * it continues up the tree until it finds the highest-level device that is offline.
 *
 * @param {string} deviceId The ID of the device that was initially reported as DOWN.
 * @param {string} tenantId The ID of the tenant who owns the device.
 * @returns {Promise<object>} An object containing the root cause device and the path taken.
 */
const verifyRootCause = async (deviceId, tenantId) => {
  console.log(`[Diagnostic Engine] Verifying root cause for device: ${deviceId}`);

  const device = await Device.findOne({ _id: deviceId, tenant: tenantId }).populate('parentId');

  if (!device) {
    console.error(`[Diagnostic Engine] Device ${deviceId} not found.`);
    return { error: 'Device not found' };
  }

  // If the device has no parent, it is the root cause by default.
  if (!device.parentId) {
    console.log(`[Diagnostic Engine] No parent found for ${device.deviceName}. It is the root cause.`);
    // In a real scenario, you might want to check the device itself one last time.
    // For now, we assume the initial "DOWN" report is accurate.
    return { rootCause: device, path: [device] };
  }

  const parent = device.parentId;
  console.log(`[Diagnostic Engine] Checking parent: ${parent.deviceName} (${parent.ipAddress})`);

  // We need a core router to proxy the ping through.
  // This logic will need to be enhanced to select the correct core router.
  const coreRouter = await MikrotikRouter.findOne({ tenant: tenantId, isCoreRouter: true }); // Assuming a flag `isCoreRouter`
  if (!coreRouter) {
      console.error(`[Diagnostic Engine] No core router found for tenant ${tenantId} to proxy ping.`);
      return { error: 'Core router not found' };
  }

  const isParentOnline = await checkCPEStatus(parent, coreRouter);

  if (isParentOnline) {
    console.log(`[Diagnostic Engine] Parent ${parent.deviceName} is ONLINE. Root cause is ${device.deviceName}.`);
    return { rootCause: device, path: [parent, device] };
  } else {
    console.log(`[Diagnostic Engine] Parent ${parent.deviceName} is OFFLINE. Walking up the tree...`);
    // Mark the parent as down
    parent.status = 'DOWN';
    await parent.save();
    
    // Recurse to the next parent
    const result = await verifyRootCause(parent._id, tenantId);
    
    // Prepend the current device to the path for the final report
    return { ...result, path: [device, ...result.path] };
  }
};

module.exports = { verifyRootCause };
