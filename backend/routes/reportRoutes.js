const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../controllers/reportController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.post('/location', protect, isSuperAdminOrAdminTenant, getLocationReport);
router.get('/mpesa-alerts', protect, isSuperAdminOrAdminTenant, getMpesaAlerts);
router.delete('/mpesa-alerts/:id', protect, isSuperAdminOrAdminTenant, deleteMpesaAlert);
router.post('/mpesa-report', 
  [protect, isSuperAdminOrAdminTenant], 
  [
    body('startDate', 'Start date is required').isISO8601().toDate(),
    body('endDate', 'End date is required').isISO8601().toDate(),
  ],
  getMpesaReport
);

module.exports = router;
