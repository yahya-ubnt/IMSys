const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const DiagnosticService = require('../services/DiagnosticService');

// @desc    Run a new diagnostic check for a user
// @route   POST /api/v1/users/:userId/diagnostics
// @access  Private
const runDiagnostic = asyncHandler(async (req, res) => {
  const { stream = true } = req.body;
  const { userId } = req.params;

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    DiagnosticService.runDiagnostic(userId, req.user.tenant, sendEvent)
      .catch(error => {
        console.error('Diagnostic Error:', error);
        sendEvent('error', { message: error.message || 'An unknown error occurred.' });
      })
      .finally(() => res.end());

  } else {
    try {
      const log = await DiagnosticService.runDiagnostic(userId, req.user.tenant);
      res.status(200).json(log);
    } catch (error) {
      console.error('Diagnostic Error:', error);
      res.status(500).json({ message: error.message || 'An unknown error occurred.' });
    }
  }
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
    const logs = await DiagnosticService.getDiagnosticHistory(userId, req.user.tenant);
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
    const log = await DiagnosticService.getDiagnosticLogById(logId, userId, req.user.tenant);

    res.status(200).json(log);
});

module.exports = {
  runDiagnostic,
  getDiagnosticHistory,
  getDiagnosticLogById,
};