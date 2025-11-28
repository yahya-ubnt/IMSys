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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware'); // Assuming you have admin middleware

// All these routes should be protected and restricted to admins.
router.route('/')
  .get(protect, isSuperAdminOrAdmin, getSmsProviders)
  .post(
    protect,
    isSuperAdminOrAdmin,
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['celcom', 'africastalking', 'twilio', 'generic_http']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createSmsProvider
  );

router.route('/:id')
  .get(protect, isSuperAdminOrAdmin, getSmsProviderById)
  .put(protect, isSuperAdminOrAdmin, updateSmsProvider)
  .delete(protect, isSuperAdminOrAdmin, deleteSmsProvider);

router.route('/:id/set-active')
    .post(protect, isSuperAdminOrAdmin, setActiveSmsProvider);

module.exports = router;