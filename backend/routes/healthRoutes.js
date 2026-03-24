const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * @desc    Health check endpoint
 * @route   GET /api/v1/health
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };

  if (mongoose.connection.readyState === 1) {
    res.status(200).send(healthcheck);
  } else {
    res.status(503).send(healthcheck); // 503 Service Unavailable
  }
});

module.exports = router;
