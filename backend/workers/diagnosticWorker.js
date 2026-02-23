const { Worker } = require('bullmq');
const { verifyRootCause } = require('../services/DiagnosticService');
const Device = require('../models/Device');
const { sendConsolidatedAlert } = require('../services/alertingService');
const connectDB = require('../config/db');

// Connect to DB for the worker
connectDB();

console.log('Diagnostic Worker process started.');

const diagnosticWorker = new Worker('diagnostic-queue', async (job) => {
  const { deviceId } = job.data;
  console.log(`[Diagnostic Worker] Processing job for deviceId: ${deviceId}`);

  try {
    // We need the tenantId to perform the check. Let's look up the device first.
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new Error(`Device with ID ${deviceId} not found.`);
    }
    
    console.log(`[Diagnostic Worker] Found device: ${device.deviceName}, Tenant: ${device.tenant}`);
    
    const result = await verifyRootCause(deviceId, device.tenant);
    
    console.log(`[Diagnostic Worker] Diagnosis complete for device: ${deviceId}. Root cause: ${result.rootCause?.deviceName || 'N/A'}`);
    
    // If we found a root cause, send an alert for it.
    if (result.rootCause) {
        // We pass the rootCause as an array to sendConsolidatedAlert
        await sendConsolidatedAlert([result.rootCause], 'DOWN (Root Cause)', device.tenant, null, 'Device');
    }

  } catch (error) {
    console.error(`[Diagnostic Worker] Job for deviceId ${deviceId} failed:`, error);
    // You might want to add retry logic or move to a failed jobs queue here.
    throw error; // Throw error to let BullMQ know the job failed
  }
}, {
  connection: {
    host: 'redis',
    port: 6379,
  },
});

diagnosticWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

diagnosticWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}`);
});

module.exports = diagnosticWorker;
