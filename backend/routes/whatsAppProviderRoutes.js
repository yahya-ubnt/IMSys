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
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, admin, getWhatsAppProviders)
  .post(
    protect,
    admin,
    [
      body('name', 'Provider name is required').not().isEmpty(),
      body('providerType', 'Invalid provider type').isIn(['twilio']),
      body('credentials', 'Credentials are required').isObject(),
    ],
    createWhatsAppProvider
  );

router.route('/:id')
  .put(protect, admin, updateWhatsAppProvider)
  .delete(protect, admin, deleteWhatsAppProvider);

router.route('/:id/set-active')
    .post(protect, admin, setActiveWhatsAppProvider);

module.exports = router;