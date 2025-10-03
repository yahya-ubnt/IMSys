const express = require('express');
const router = express.Router();
const { composeAndSendWhatsApp } = require('../controllers/whatsappController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   POST /api/whatsapp/compose
router.post('/compose', protect, admin, composeAndSendWhatsApp);

// Future route for logs
// router.get('/logs', protect, admin, getWhatsAppLogs);

module.exports = router;