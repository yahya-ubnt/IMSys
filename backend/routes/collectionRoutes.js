const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../controllers/collectionController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(isSuperAdminOrAdmin, getCollectionStats);
router.route('/monthly-totals').get(isSuperAdminOrAdmin, getMonthlyCollectionTotals);
router.route('/daily-totals').get(isSuperAdminOrAdmin, getDailyCollectionTotals);
router.route('/').get(isSuperAdminOrAdmin, getCollections);

module.exports = router;