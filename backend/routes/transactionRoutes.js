const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionStats, getMonthlyTransactionTotals, } = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, getTransactionStats);
router.route('/monthly-totals').get(protect, getMonthlyTransactionTotals);
router.route('/').post(protect, createTransaction).get(protect, getTransactions);
router
  .route('/:id')
  .get(protect, getTransactionById)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

module.exports = router;
