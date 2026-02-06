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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');
const diagnosticRoutes = require('./diagnosticRoutes');
const Package = require('../models/Package'); // Import Package model

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
    body('username', 'Username is required and can only contain alphanumeric characters, hyphens, and underscores').not().isEmpty().matches(/^[a-zA-Z0-9_-]+$/),
    body('officialName', 'Official name is required').not().isEmpty(),
    body('billingCycle', 'Billing cycle is required').not().isEmpty(),
    body('mobileNumber', 'Mobile number is required').not().isEmpty(),
    body('expiryDate', 'Expiry date is required and must be a valid date').isISO8601().toDate(),
    body('pppoePassword', 'PPPoE password is required for PPPoE users').if(body('serviceType').equals('pppoe')).not().isEmpty(),
    body('package', 'Selected package is invalid for the service type').custom(async (packageId, { req }) => {
      const { serviceType } = req.body;
      const selectedPackage = await Package.findById(packageId);
      if (!selectedPackage) {
        throw new Error('Package not found');
      }
      if (serviceType === 'pppoe' && !selectedPackage.profile) {
        throw new Error('Selected PPPoE package must have a profile defined');
      }
      if (serviceType === 'static' && !selectedPackage.rateLimit) {
        throw new Error('Selected Static package must have a rate limit defined');
      }
      return true;
    }),
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
  .put(
    protect,
    isSuperAdminOrAdmin,
    [
      body('mikrotikRouter', 'Mikrotik Router ID is invalid').optional().isMongoId(),
      body('serviceType', 'Service type is invalid').optional().isIn(['pppoe', 'static']),
      body('package', 'Package ID is invalid').optional().isMongoId(),
      body('username', 'Username can only contain alphanumeric characters, hyphens, and underscores').optional().matches(/^[a-zA-Z0-9_-]+$/),
      body('officialName', 'Official name must be a string').optional().isString(),
      body('billingCycle', 'Billing cycle must be a string').optional().isString(),
      body('mobileNumber', 'Mobile number is invalid').optional().isString(), // More specific phone validation can be added
      body('expiryDate', 'Expiry date must be a valid date').optional().isISO8601().toDate(),
      body('pppoePassword', 'PPPoE password must be a string').if(body('serviceType').equals('pppoe')).optional().not().isEmpty(),
      body('package', 'Selected package is invalid for the service type').optional().custom(async (packageId, { req }) => {
        const { serviceType } = req.body;
        if (!packageId) return true; // If packageId is not provided, skip this validation

        const selectedPackage = await Package.findById(packageId);
        if (!selectedPackage) {
          throw new Error('Package not found');
        }
        if (serviceType === 'pppoe' && !selectedPackage.profile) {
          throw new Error('Selected PPPoE package must have a profile defined');
        }
        if (serviceType === 'static' && !selectedPackage.rateLimit) {
          throw new Error('Selected Static package must have a rate limit defined');
        }
        return true;
      }),
    ],
    updateMikrotikUser
  )
  .delete(protect, isSuperAdminOrAdmin, deleteMikrotikUser);


module.exports = router;
