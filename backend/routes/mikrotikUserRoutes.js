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
} = require('../controllers/mikrotikUserController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(protect, isAdminTenant, getMikrotikClientsForSms);
router.route('/delayed-payments').get(protect, isAdminTenant, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(protect, isAdminTenant, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(protect, isAdminTenant, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(protect, isAdminTenant, getMonthlyTotalSubscribers);

router.route('/').get(protect, isAdminTenant, getMikrotikUsers).post(
  [protect, isAdminTenant],
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
router.use('/:userId/diagnostics', protect, isAdminTenant, diagnosticRoutes);

router.route('/:id/status').get(protect, isAdminTenant, getMikrotikUserStatus);
router.route('/:id/traffic').get(protect, isAdminTenant, getMikrotikUserTraffic);
router.route('/:id/payment-stats').get(protect, isAdminTenant, getUserPaymentStats);
router.route('/:userId/downtime-logs').get(protect, isAdminTenant, getDowntimeLogs);

router
  .route('/:id')
  .get(protect, isAdminTenant, getMikrotikUserById)
  .put(protect, isAdminTenant, updateMikrotikUser)
  .delete(protect, isAdminTenant, deleteMikrotikUser);


module.exports = router;
