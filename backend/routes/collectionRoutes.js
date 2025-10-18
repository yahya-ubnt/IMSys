const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../controllers/collectionController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isAdminTenant, getCollectionStats);
router.route('/monthly-totals').get(protect, isAdminTenant, getMonthlyCollectionTotals);
router.route('/daily-totals').get(protect, isAdminTenant, getDailyCollectionTotals);
router.route('/').get(protect, isAdminTenant, getCollections);

module.exports = router;