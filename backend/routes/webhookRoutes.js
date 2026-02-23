const express = require('express');
const { handleNetworkEvent } = require('../controllers/webhookController');

const router = express.Router();

// This route is public but protected by an API key in the controller
router.post('/network-event', handleNetworkEvent);

module.exports = router;
