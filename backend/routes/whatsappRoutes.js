const express = require('express');
const router = express.Router();
const { composeAndSendWhatsApp } = require('../controllers/whatsappController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

// @route   POST /api/whatsapp/compose
router.post('/compose', protect, isAdminTenant, composeAndSendWhatsApp);

// Future route for logs
// router.get('/logs', protect, isAdminTenant, getWhatsAppLogs);

module.exports = router;