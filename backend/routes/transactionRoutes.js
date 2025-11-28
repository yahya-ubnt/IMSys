const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionStats, getMonthlyTransactionTotals, } = require('../controllers/transactionController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isSuperAdminOrAdmin, getTransactionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdmin, getMonthlyTransactionTotals);
router.route('/').post(protect, isSuperAdminOrAdmin, createTransaction).get(protect, isSuperAdminOrAdmin, getTransactions);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getTransactionById)
  .put(
    protect,
    isSuperAdminOrAdmin,
    [
      body('date', 'Date must be a valid date').optional().isISO8601().toDate(),
      body('amount', 'Amount must be a number').optional().isNumeric(),
      body('method', 'Invalid payment method').optional().isIn(['M-Pesa', 'Bank', 'Cash']),
      body('transactionMessage', 'Transaction message must be a string').optional().isString(),
      body('description', 'Description must be a string').optional().isString(),
      body('label', 'Label must be a string').optional().isString(),
      body('transactionId', 'Transaction ID must be a string').optional().isString(),
      body('transactionDate', 'Transaction date must be a valid date').optional().isISO8601().toDate(),
      body('transactionTime', 'Transaction time must be a string').optional().isString(),
      body('receiverEntity', 'Receiver entity must be a string').optional().isString(),
      body('phoneNumber', 'Phone number must be valid').optional().matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
      body('newBalance', 'New balance must be a number').optional().isNumeric(),
      body('transactionCost', 'Transaction cost must be a number').optional().isNumeric(),
    ],
    updateTransaction
  )
  .delete(protect, isSuperAdminOrAdmin, deleteTransaction);

module.exports = router;
