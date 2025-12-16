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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');
const diagnosticRoutes = require('./diagnosticRoutes');

// More specific routes should come before more general ones
router.route('/clients-for-sms').get(isSuperAdminOrAdmin, getMikrotikClientsForSms);
router.route('/delayed-payments').get(isSuperAdminOrAdmin, getDelayedPayments);

router.route('/stats/monthly-new-subscribers').get(isSuperAdminOrAdmin, getMonthlyNewSubscribers);
router.route('/stats/monthly-paid-subscribers').get(isSuperAdminOrAdmin, getMonthlyPaidSubscribers);
router.route('/stats/monthly-total-subscribers/:year').get(isSuperAdminOrAdmin, getMonthlyTotalSubscribers);

router.route('/').get(isSuperAdminOrAdmin, getMikrotikUsers).post(
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
router.use('/:userId/diagnostics', isSuperAdminOrAdmin, diagnosticRoutes);

router.route('/:id/status').get(isSuperAdminOrAdmin, getMikrotikUserStatus);
router.route('/:id/traffic').get(isSuperAdminOrAdmin, getMikrotikUserTraffic);
router.route('/:id/payment-stats').get(isSuperAdminOrAdmin, getUserPaymentStats);
router.route('/:userId/downtime-logs').get(isSuperAdminOrAdmin, getDowntimeLogs);

router.route('/:id/disconnect').post(isSuperAdminOrAdmin, manualDisconnectUser);
router.route('/:id/connect').post(isSuperAdminOrAdmin, manualConnectUser);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getMikrotikUserById)
  .put(isSuperAdminOrAdmin, updateMikrotikUser)
  .delete(isSuperAdminOrAdmin, deleteMikrotikUser);


module.exports = router;
