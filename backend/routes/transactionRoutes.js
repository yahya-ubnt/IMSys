const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionStats, getMonthlyTransactionTotals, } = require('../controllers/transactionController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isSuperAdminOrAdminTenant, getTransactionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdminTenant, getMonthlyTransactionTotals);
router.route('/').post(protect, isSuperAdminOrAdminTenant, createTransaction).get(protect, isSuperAdminOrAdminTenant, getTransactions);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getTransactionById)
  .put(
    [protect, isSuperAdminOrAdminTenant],
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
  .delete(protect, isSuperAdminOrAdminTenant, deleteTransaction);

module.exports = router;
