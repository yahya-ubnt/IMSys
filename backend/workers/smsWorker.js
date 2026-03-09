const { Worker } = require('bullmq');
const path = require('path');
const connectDB = require('../config/db');
const SmsProvider = require('../models/SmsProvider');
const SmsLog = require('../models/SmsLog');

// Connect to DB once for the worker
connectDB();

const redisConnection = {
  host: 'redis',
  port: 6379,
};

/**
 * Dynamically loads and executes an SMS provider driver.
 * This is a helper function isolated within the worker.
 * @param {string} providerType - The type of the provider (e.g., 'celcom', 'twilio').
 * @param {object} credentials - The decrypted credentials for the provider.
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {string} message - The SMS message body.
 * @returns {Promise<{success: boolean, message: string}>} - The result from the provider.
 */
const executeSmsDriver = async (providerType, credentials, phoneNumber, message) => {
  try {
    const driverPath = path.join(__dirname, '..', 'services', 'smsDrivers', `${providerType}.js`);
    const driver = require(driverPath);
    return await driver.sendMessage(credentials, phoneNumber, message);
  } catch (error) {
    console.error(`Error loading or executing SMS driver for '${providerType}':`, error);
    if (error.code === 'MODULE_NOT_FOUND') {
      return { success: false, message: `SMS provider driver for '${providerType}' not found.` };
    }
    return { success: false, message: `An unexpected error occurred with the '${providerType}' SMS driver.` };
  }
};


const smsWorker = new Worker('SMS', async (job) => {
  const { to, message, tenantId, mikrotikUserId, messageType } = job.data;
  const { name: jobType } = job;

  console.log(`[${new Date().toISOString()}] SMS Worker: Processing job '${jobType}' for ${to} (Tenant: ${tenantId})`);

  if (jobType !== 'sendSms') {
    console.warn(`[${new Date().toISOString()}] SMS Worker: Unknown job type: ${jobType}`);
    return;
  }

  let log;
  try {
    // 1. Log the attempt first
    log = await SmsLog.create({
      mobileNumber: to,
      message: message,
      messageType: messageType || 'System',
      smsStatus: 'Pending',
      tenant: tenantId,
      mikrotikUser: mikrotikUserId,
    });

    // 2. Find the active SMS provider for the tenant
    const activeProvider = await SmsProvider.findOne({ tenant: tenantId, isActive: true });

    if (!activeProvider) {
      throw new Error(`No active SMS provider configured for tenant ${tenantId}.`);
    }

    // 3. Get decrypted credentials (handled by model's 'get' hook)
    const credentials = activeProvider.credentials;
    if (!credentials) {
        throw new Error(`Failed to decrypt credentials for provider: ${activeProvider.name}`);
    }

    // 4. Execute the appropriate driver
    const result = await executeSmsDriver(
      activeProvider.providerType,
      credentials,
      to,
      message
    );

    // 5. Update the log with the final result
    log.smsStatus = result.success ? 'Success' : 'Failed';
    log.providerResponse = result.message;
    await log.save();

    console.log(`[${new Date().toISOString()}] SMS Worker: SMS to ${to} via ${activeProvider.name}: ${result.message}`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] SMS Worker: Error processing job '${jobType}' for ${to}:`, error.message);
    // If a log entry was created, update it to reflect the failure
    if (log) {
      log.smsStatus = 'Failed';
      log.providerResponse = error.message;
      await log.save();
    }
    throw error; // Re-throw to mark job as failed in BullMQ
  }
}, {
  connection: redisConnection,
  // Concurrency can be adjusted based on SMS provider rate limits
  concurrency: 5, 
});

console.log(`[${new Date().toISOString()}] SMS Worker started.`);

module.exports = smsWorker;
