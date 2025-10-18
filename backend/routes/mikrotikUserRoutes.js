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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(protect, isSuperAdminOrAdminTenant, getMikrotikClientsForSms);
router.route('/delayed-payments').get(protect, isSuperAdminOrAdminTenant, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(protect, isSuperAdminOrAdminTenant, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(protect, isSuperAdminOrAdminTenant, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(protect, isSuperAdminOrAdminTenant, getMonthlyTotalSubscribers);

router.route('/').get(protect, isSuperAdminOrAdminTenant, getMikrotikUsers).post(
  [protect, isSuperAdminOrAdminTenant],
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
router.use('/:userId/diagnostics', protect, isSuperAdminOrAdminTenant, diagnosticRoutes);

router.route('/:id/status').get(protect, isSuperAdminOrAdminTenant, getMikrotikUserStatus);
router.route('/:id/traffic').get(protect, isSuperAdminOrAdminTenant, getMikrotikUserTraffic);
router.route('/:id/payment-stats').get(protect, isSuperAdminOrAdminTenant, getUserPaymentStats);
router.route('/:userId/downtime-logs').get(protect, isSuperAdminOrAdminTenant, getDowntimeLogs);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getMikrotikUserById)
  .put(protect, isSuperAdminOrAdminTenant, updateMikrotikUser)
  .delete(protect, isSuperAdminOrAdminTenant, deleteMikrotikUser);


module.exports = router;
