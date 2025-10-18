const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../controllers/collectionController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isSuperAdminOrAdminTenant, getCollectionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdminTenant, getMonthlyCollectionTotals);
router.route('/daily-totals').get(protect, isSuperAdminOrAdminTenant, getDailyCollectionTotals);
router.route('/').get(protect, isSuperAdminOrAdminTenant, getCollections);

module.exports = router;