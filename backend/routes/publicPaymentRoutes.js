const express = require('express');
const router = express.Router();
const { handleDarajaCallback } = require('../controllers/paymentController');

// M-Pesa C2B & STK Callbacks
router.post('/daraja-callback', handleDarajaCallback);

module.exports = router;
