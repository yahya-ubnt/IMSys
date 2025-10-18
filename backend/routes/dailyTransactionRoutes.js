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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

// Specific routes must come before generic routes
router.route('/stats').get(protect, isSuperAdminOrAdminTenant, getDailyTransactionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdminTenant, getMonthlyTransactionTotals);
router.route('/daily-collection-totals').get(protect, isSuperAdminOrAdminTenant, getDailyCollectionTotals);

router.route('/').post(
  [protect, isSuperAdminOrAdminTenant],
  [
    body('amount', 'Amount must be a number').isNumeric(),
    body('method', 'Invalid payment method').isIn(['M-Pesa', 'Bank', 'Cash']),
    body('transactionMessage', 'Transaction message is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('label', 'Label is required').not().isEmpty(),
    body('category', 'Invalid category').isIn(['Personal', 'Company']),
  ],
  createDailyTransaction
).get(protect, isSuperAdminOrAdminTenant, getDailyTransactions);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getDailyTransactionById)
  .put(protect, isSuperAdminOrAdminTenant, updateDailyTransaction)
  .delete(protect, isSuperAdminOrAdminTenant, deleteDailyTransaction);

module.exports = router;
