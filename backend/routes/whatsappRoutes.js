const express = require('express');
const router = express.Router();
const { composeAndSendWhatsApp } = require('../controllers/whatsappController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

// @route   POST /api/whatsapp/compose
router.post('/compose', protect, isSuperAdminOrAdminTenant, composeAndSendWhatsApp);

// Future route for logs
// router.get('/logs', protect, isSuperAdminOrAdminTenant, getWhatsAppLogs);

module.exports = router;