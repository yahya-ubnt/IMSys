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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

// Specific routes must come before generic routes
router.route('/stats').get(isSuperAdminOrAdmin, getDailyTransactionStats);
router.route('/monthly-totals').get(isSuperAdminOrAdmin, getMonthlyTransactionTotals);
router.route('/daily-collection-totals').get(isSuperAdminOrAdmin, getDailyCollectionTotals);

router.route('/').post(
  [isSuperAdminOrAdmin],
  [
    body('amount', 'Amount must be a number').isNumeric(),
    body('method', 'Invalid payment method').isIn(['M-Pesa', 'Bank', 'Cash']),
    body('transactionMessage').optional(),
    body('description').optional(),
    body('label', 'Label is required').not().isEmpty(),
    body('category', 'Invalid category').isIn(['Personal', 'Company']),
  ],
  createDailyTransaction
).get(isSuperAdminOrAdmin, getDailyTransactions);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getDailyTransactionById)
  .put(isSuperAdminOrAdmin, updateDailyTransaction)
  .delete(isSuperAdminOrAdmin, deleteDailyTransaction);

module.exports = router;
