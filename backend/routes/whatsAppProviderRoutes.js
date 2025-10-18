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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, isAdminTenant, getWhatsAppProviders)
  .post(
    [protect, isAdminTenant],
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['twilio']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createWhatsAppProvider
  );

router.route('/:id')
  .put(protect, isAdminTenant, updateWhatsAppProvider)
  .delete(protect, isAdminTenant, deleteWhatsAppProvider);

router.route('/:id/set-active')
    .post(protect, isAdminTenant, setActiveWhatsAppProvider);

module.exports = router;