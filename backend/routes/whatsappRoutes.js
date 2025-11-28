const express = require('express');
const router = express.Router();
const { composeAndSendWhatsApp } = require('../controllers/whatsappController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.post('/compose', protect, isSuperAdminOrAdmin, composeAndSendWhatsApp);

// router.get('/logs', protect, isSuperAdminOrAdmin, getWhatsAppLogs);

module.exports = router;