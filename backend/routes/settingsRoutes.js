const express = require('express');
const router = express.Router();
const {
  getBrandingSettings,
  updateBrandingSettings,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/branding').get(protect, getBrandingSettings).put(protect, admin, updateBrandingSettings);

module.exports = router;