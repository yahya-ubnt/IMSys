const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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
  manualDisconnectUser,
  manualConnectUser,
} = require('../controllers/mikrotikUserController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(protect, isSuperAdminOrAdmin, getMikrotikClientsForSms);
router.route('/delayed-payments').get(protect, isSuperAdminOrAdmin, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(protect, isSuperAdminOrAdmin, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(protect, isSuperAdminOrAdmin, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(protect, isSuperAdminOrAdmin, getMonthlyTotalSubscribers);

router.route('/').get(protect, isSuperAdminOrAdmin, getMikrotikUsers).post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('mikrotikRouter', 'Mikrotik Router ID is required').isMongoId(),
    body('serviceType', 'Service type is required').isIn(['pppoe', 'static']),
    body('package', 'Package ID is required').isMongoId(),
    body('username', 'Username is required').not().isEmpty(),
    body('officialName', 'Official name is required').not().isEmpty(),
    body('billingCycle', 'Billing cycle is required').not().isEmpty(),
    body('mobileNumber', 'Mobile number is required').not().isEmpty(),
    body('expiryDate', 'Expiry date is required and must be a valid date').isISO8601().toDate(),
    body('pppoePassword', 'PPPoE password is required for PPPoE users').if(body('serviceType').equals('pppoe')).not().isEmpty(),
  ],
  createMikrotikUser
);

// Mount diagnostic routes before all other /:id routes to ensure it's matched first.
router.use('/:userId/diagnostics', protect, isSuperAdminOrAdmin, diagnosticRoutes);

router.route('/:id/status').get(protect, isSuperAdminOrAdmin, getMikrotikUserStatus);
router.route('/:id/traffic').get(protect, isSuperAdminOrAdmin, getMikrotikUserTraffic);
router.route('/:id/payment-stats').get(protect, isSuperAdminOrAdmin, getUserPaymentStats);
router.route('/:userId/downtime-logs').get(protect, isSuperAdminOrAdmin, getDowntimeLogs);

router.route('/:id/disconnect').post(protect, isSuperAdminOrAdmin, manualDisconnectUser);
router.route('/:id/connect').post(protect, isSuperAdminOrAdmin, manualConnectUser);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getMikrotikUserById)
  .put(protect, isSuperAdminOrAdmin, updateMikrotikUser)
  .delete(protect, isSuperAdminOrAdmin, deleteMikrotikUser);


module.exports = router;
