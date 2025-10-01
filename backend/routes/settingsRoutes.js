const express = require('express');
const router = express.Router();
const {
  getBrandingSettings,
  updateBrandingSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/branding').get(protect, getBrandingSettings).put(protect, admin, updateBrandingSettings);
router.route('/mpesa').get(protect, admin, getMpesaSettings).put(protect, admin, updateMpesaSettings);
router.route('/mpesa/activate').post(protect, admin, activateMpesa);

module.exports = router;