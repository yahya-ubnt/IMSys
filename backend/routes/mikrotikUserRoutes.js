const express = require('express');
const router = express.Router();
const {
  createMikrotikUser,
  getMikrotikUsers,
  getMikrotikUserById,
  updateMikrotikUser,
  deleteMikrotikUser,
  getMikrotikClientsForSms,
  getMonthlyNewSubscribers,
  getMonthlyPaidSubscribers,
  getMonthlyTotalSubscribers,
  getMikrotikUserStatus,
  getMikrotikUserTraffic,
  getDowntimeLogs,
  getDelayedPayments,
  getUserPaymentStats,
} = require('../controllers/mikrotikUserController');
const protect = require('../middlewares/protect').protect;
const admin = require('../middlewares/protect').admin;
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(protect, getMikrotikClientsForSms);
router.route('/delayed-payments').get(protect, admin, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(protect, admin, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(protect, admin, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(protect, admin, getMonthlyTotalSubscribers);

router.route('/').get(protect, admin, getMikrotikUsers).post(protect, admin, createMikrotikUser);

// Mount diagnostic routes before all other /:id routes to ensure it's matched first.
router.use('/:userId/diagnostics', protect, admin, diagnosticRoutes);

router.route('/:id/status').get(protect, admin, getMikrotikUserStatus);
router.route('/:id/traffic').get(protect, admin, getMikrotikUserTraffic);
router.route('/:id/payment-stats').get(protect, admin, getUserPaymentStats);
router.route('/:userId/downtime-logs').get(protect, admin, getDowntimeLogs);

router
  .route('/:id')
  .get(protect, admin, getMikrotikUserById)
  .put(protect, admin, updateMikrotikUser)
  .delete(protect, admin, deleteMikrotikUser);


module.exports = router;
