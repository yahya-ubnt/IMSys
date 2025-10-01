const express = require('express');
const router = express.Router();
const {
  createDailyTransaction,
  getDailyTransactions,
  getDailyTransactionById,
  updateDailyTransaction,
  deleteDailyTransaction,
  getDailyTransactionStats,
  getMonthlyTransactionTotals,
  getDailyCollectionTotals,
} = require('../controllers/dailyTransactionController');
const { protect } = require('../middlewares/authMiddleware');

// Specific routes must come before generic routes
router.route('/stats').get(protect, getDailyTransactionStats);
router.route('/monthly-totals').get(protect, getMonthlyTransactionTotals);
router.route('/daily-collection-totals').get(protect, getDailyCollectionTotals);

router.route('/').post(protect, createDailyTransaction).get(protect, getDailyTransactions);

router
  .route('/:id')
  .get(protect, getDailyTransactionById)
  .put(protect, updateDailyTransaction)
  .delete(protect, deleteDailyTransaction);

module.exports = router;
