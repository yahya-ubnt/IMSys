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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

// Specific routes must come before generic routes
router.route('/stats').get(protect, isAdminTenant, getDailyTransactionStats);
router.route('/monthly-totals').get(protect, isAdminTenant, getMonthlyTransactionTotals);
router.route('/daily-collection-totals').get(protect, isAdminTenant, getDailyCollectionTotals);

router.route('/').post(
  [protect, isAdminTenant],
  [
    body('amount', 'Amount must be a number').isNumeric(),
    body('method', 'Invalid payment method').isIn(['M-Pesa', 'Bank', 'Cash']),
    body('transactionMessage', 'Transaction message is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('label', 'Label is required').not().isEmpty(),
    body('category', 'Invalid category').isIn(['Personal', 'Company']),
  ],
  createDailyTransaction
).get(protect, isAdminTenant, getDailyTransactions);

router
  .route('/:id')
  .get(protect, isAdminTenant, getDailyTransactionById)
  .put(protect, isAdminTenant, updateDailyTransaction)
  .delete(protect, isAdminTenant, deleteDailyTransaction);

module.exports = router;
