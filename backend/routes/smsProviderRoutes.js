const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSmsProviders,
  getSmsProviderById,
  createSmsProvider,
  updateSmsProvider,
  deleteSmsProvider,
  setActiveSmsProvider,
} = require('../controllers/smsProviderController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware'); // Assuming you have admin middleware

// All these routes should be protected and restricted to admins.
router.route('/')
  .get(protect, isSuperAdminOrAdminTenant, getSmsProviders)
  .post(
    [protect, isSuperAdminOrAdminTenant],
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['celcom', 'africastalking', 'twilio', 'generic_http']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createSmsProvider
  );

router.route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getSmsProviderById)
  .put(protect, isSuperAdminOrAdminTenant, updateSmsProvider)
  .delete(protect, isSuperAdminOrAdminTenant, deleteSmsProvider);

router.route('/:id/set-active')
    .post(protect, isSuperAdminOrAdminTenant, setActiveSmsProvider);

module.exports = router;