const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../controllers/reportController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.post('/location', isSuperAdminOrAdmin, getLocationReport);
router.get('/mpesa-alerts', isSuperAdminOrAdmin, getMpesaAlerts);
router.delete('/mpesa-alerts/:id', isSuperAdminOrAdmin, deleteMpesaAlert);
router.post('/mpesa-report', isSuperAdminOrAdmin, getMpesaReport);

module.exports = router;
