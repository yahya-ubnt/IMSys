const express = require('express');
const router = express.Router();
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
router.post('/mpesa-report', protect, getMpesaReport);

module.exports = router;
