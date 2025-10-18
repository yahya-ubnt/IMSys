const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../controllers/reportController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.post('/location', protect, isAdminTenant, getLocationReport);
router.get('/mpesa-alerts', protect, isAdminTenant, getMpesaAlerts);
router.delete('/mpesa-alerts/:id', protect, isAdminTenant, deleteMpesaAlert);
router.post('/mpesa-report', 
  [protect, isAdminTenant], 
  [
    body('startDate', 'Start date is required').isISO8601().toDate(),
    body('endDate', 'End date is required').isISO8601().toDate(),
  ],
  getMpesaReport
);

module.exports = router;
