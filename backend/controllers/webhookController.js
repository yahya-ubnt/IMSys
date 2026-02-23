const asyncHandler = require('express-async-handler');
const diagnosticQueue = require('../queues/diagnosticQueue'); // Assuming a dedicated queue for diagnostics

// @desc    Handle incoming network events from device webhooks
// @route   POST /api/webhooks/network-event
// @access  Public (requires a secret API key for verification)
exports.handleNetworkEvent = asyncHandler(async (req, res, next) => {
  const { deviceId, status, apiKey } = req.query;

  // Simple API Key validation
  if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
    res.status(401);
    throw new Error('Unauthorized: Invalid API Key');
  }

  if (!deviceId || !status) {
    res.status(400);
    throw new Error('Bad Request: Missing deviceId or status');
  }

  // We only care about "DOWN" events to trigger the diagnostic engine
  if (status.toUpperCase() === 'DOWN') {
    console.log(`[Webhook] Received DOWN event for device: ${deviceId}. Queueing for diagnosis.`);
    
    // Add a job to the diagnostic queue.
    // We assume the webhook provides the device's tenantId or we look it up.
    // For now, let's assume a lookup is needed, or it's part of the webhook.
    // This part will need refinement.
    await diagnosticQueue.add('verifyDeviceStatus', { deviceId });
  }

  res.status(200).json({ success: true, message: 'Event received' });
});
