const ScheduledTask = require('../models/ScheduledTask');

const defaultTasks = [
  {
    name: 'Automated Disconnection of Expired Users',
    description: 'Disconnects users from the network whose expiryDate has passed.',
    scriptPath: 'scripts/disconnectExpiredClients.js',
    schedule: '59 23 * * *', // Every day at 11:59 PM
    isEnabled: true,
  },
  {
    name: 'Automated Database Log Cleanup',
    description: 'Archives or deletes old log records to maintain database performance.',
    scriptPath: 'scripts/cleanupOldLogs.js',
    schedule: '5 3 * * 0', // Every Sunday at 3:05 AM
    isEnabled: true,
  },
  {
    name: 'SMS Expiry Notification',
    description: 'Sends expiry notifications to customers based on configurable schedules with robust logic.',
    scriptPath: 'scripts/sendExpiryNotifications.js',
    schedule: '0 0 * * *', // Every day at midnight
    isEnabled: true,
  },
];

const createDefaultTasksForTenant = async (tenantId) => {
  try {
    for (const defaultTask of defaultTasks) {
      await ScheduledTask.create({
        ...defaultTask,
        tenant: tenantId,
      });
    }
    console.log(`Successfully created default scheduled tasks for tenant ${tenantId}`);
  } catch (error) {
    console.error(`Error creating default scheduled tasks for tenant ${tenantId}:`, error);
    // We don't want to throw an error here and fail the whole tenant creation process,
    // but we do need to log it seriously. In a real-world scenario, you might add this
    // to a retry queue or a specific monitoring system.
  }
};

module.exports = {
  createDefaultTasksForTenant,
};
