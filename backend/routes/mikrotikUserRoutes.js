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
const protect = require('../middlewares/protect').protect;
const admin = require('../middlewares/protect').admin;
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(protect, getMikrotikClientsForSms);
router.route('/delayed-payments').get(protect, admin, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(protect, admin, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(protect, admin, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(protect, admin, getMonthlyTotalSubscribers);

router.route('/').get(protect, admin, getMikrotikUsers).post(
  protect,
  admin,
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
