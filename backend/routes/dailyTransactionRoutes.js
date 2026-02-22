const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

// Specific routes must come before generic routes
router.route('/stats').get(protect, isSuperAdminOrAdmin, getDailyTransactionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdmin, getMonthlyTransactionTotals);
router.route('/daily-collection-totals').get(protect, isSuperAdminOrAdmin, getDailyCollectionTotals);

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  body('amount', 'Amount must be a number').isNumeric(),
  body('method', 'Invalid payment method').isIn(['M-Pesa', 'Bank', 'Cash']),
  body('transactionMessage').optional(),
  body('description').optional(),
  body('label', 'Label is required').not().isEmpty(),
  body('category', 'Invalid category').isIn(['Personal', 'Company']),
  createDailyTransaction
).get(protect, isSuperAdminOrAdmin, getDailyTransactions);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getDailyTransactionById)
  .put(protect, isSuperAdminOrAdmin, updateDailyTransaction)
  .delete(protect, isSuperAdminOrAdmin, deleteDailyTransaction);

module.exports = router;
