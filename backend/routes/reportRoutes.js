const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLocationReport,
  getMpesaAlerts,
  deleteMpesaAlert,
  getMpesaReport,
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/location', protect, getLocationReport);
router.get('/mpesa-alerts', protect, getMpesaAlerts);
router.delete('/mpesa-alerts/:id', protect, deleteMpesaAlert);
router.post('/mpesa-report', 
  protect, 
  [
    body('startDate', 'Start date is required').isISO8601().toDate(),
    body('endDate', 'End date is required').isISO8601().toDate(),
  ],
  getMpesaReport
);

module.exports = router;
