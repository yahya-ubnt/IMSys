const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../controllers/collectionController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isSuperAdminOrAdmin, getCollectionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdmin, getMonthlyCollectionTotals);
router.route('/daily-totals').get(protect, isSuperAdminOrAdmin, getDailyCollectionTotals);
router.route('/').get(protect, isSuperAdminOrAdmin, getCollections);

module.exports = router;