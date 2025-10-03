const express = require('express');
const router = express.Router();
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
  .post(protect, admin, createWhatsAppProvider);

router.route('/:id')
  .put(protect, admin, updateWhatsAppProvider)
  .delete(protect, admin, deleteWhatsAppProvider);

router.route('/:id/set-active')
    .post(protect, admin, setActiveWhatsAppProvider);

module.exports = router;