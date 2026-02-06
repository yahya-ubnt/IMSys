const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../controllers/reportController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.post('/location', protect, isSuperAdminOrAdmin, getLocationReport);
router.get('/mpesa-alerts', protect, isSuperAdminOrAdmin, getMpesaAlerts);
router.delete('/mpesa-alerts/:id', protect, isSuperAdminOrAdmin, deleteMpesaAlert);
router.post('/mpesa-report', protect, isSuperAdminOrAdmin, getMpesaReport);

module.exports = router;
