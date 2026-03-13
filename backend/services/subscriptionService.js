// backend/services/subscriptionService.js

const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');

/**
 * Activates or extends a user's subscription upon successful payment.
 * @param {string} userId The ID of the user to activate.
 * @param {string} packageId The ID of the package being purchased.
 */
const activateUserSubscription = async (userId, packageId) => {
  try {
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      throw new Error(`Package with ID ${packageId} not found.`);
    }

    const user = await MikrotikUser.findById(userId);
    if (!user) {
      throw new Error(`MikrotikUser with ID ${userId} not found.`);
    }

    // Determine the base date for expiry calculation
    const now = new Date();
    let baseDate = now;

    // If user is renewing early, add to their existing expiry date
    if (user.expiryDate && user.expiryDate > now) {
      baseDate = user.expiryDate;
    }

    // Calculate the new expiry date
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + pkg.durationInDays);

    // Update user's properties
    user.isSuspended = false;
    user.expiryDate = newExpiryDate;
    user.package = pkg._id; // Assign the new package
    user.syncStatus = 'pending'; // Mark for sync

    await user.save();

    // Queue a job to sync the user's new state to the router
    await mikrotikSyncQueue.add('syncUser', {
      mikrotikUserId: user._id,
      tenantId: user.tenant,
    });
    
    console.log(`Successfully activated/extended subscription for user ${user.username}. New expiry: ${newExpiryDate.toISOString()}`);
    return { success: true, newExpiryDate };
  } catch (error) {
    console.error(`Error in activateUserSubscription for user ${userId}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

module.exports = {
  activateUserSubscription,
};
