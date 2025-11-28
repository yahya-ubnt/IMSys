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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .get(protect, isSuperAdminOrAdmin, getWhatsAppProviders)
  .post(
    protect,
    isSuperAdminOrAdmin,
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['twilio']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createWhatsAppProvider
  );

router
  .route('/:id')
  .put(protect, isSuperAdminOrAdmin, updateWhatsAppProvider)
  .delete(protect, isSuperAdminOrAdmin, deleteWhatsAppProvider);

router
  .route('/:id/set-active')
  .post(protect, isSuperAdminOrAdmin, setActiveWhatsAppProvider);

module.exports = router;