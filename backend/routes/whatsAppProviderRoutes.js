const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getWhatsAppProviders,
  createWhatsAppProvider,
  updateWhatsAppProvider,
  deleteWhatsAppProvider,
  setActiveWhatsAppProvider,
} = require('../controllers/whatsAppProviderController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, isSuperAdminOrAdminTenant, getWhatsAppProviders)
  .post(
    [protect, isSuperAdminOrAdminTenant],
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['twilio']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createWhatsAppProvider
  );

router.route('/:id')
  .put(protect, isSuperAdminOrAdminTenant, updateWhatsAppProvider)
  .delete(protect, isSuperAdminOrAdminTenant, deleteWhatsAppProvider);

router.route('/:id/set-active')
    .post(protect, isSuperAdminOrAdminTenant, setActiveWhatsAppProvider);

module.exports = router;