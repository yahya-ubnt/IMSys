const express = require('express');
const router = express.Router();
const {
  getGeneralSettings,
  updateGeneralSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/general').get(protect, getGeneralSettings).put(protect, admin, updateGeneralSettings);
router.route('/mpesa').get(protect, admin, getMpesaSettings).put(protect, admin, updateMpesaSettings);
router.route('/mpesa/activate').post(protect, admin, activateMpesa);

module.exports = router;