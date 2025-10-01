const express = require('express');
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getMonthlyCollectionTotals,
  getDailyCollectionTotals,
} = require('../controllers/collectionController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, getCollectionStats);
router.route('/monthly-totals').get(protect, getMonthlyCollectionTotals);
router.route('/daily-totals').get(protect, getDailyCollectionTotals);
router.route('/').get(protect, getCollections);

module.exports = router;