const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  handleDarajaCallback, 
  initiateStkPush, 
  getTransactions, 
  createCashPayment, 
  getWalletTransactions, 
  getWalletTransactionById, 
  createWalletTransaction 
} = require('../controllers/paymentController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

// M-Pesa STK Push
router.post(
  '/initiate-stk',
  protect,
  isSuperAdminOrAdmin,
  [
    body('amount', 'Amount is required').isNumeric(),
    body('phoneNumber', 'Phone number is required').isMobilePhone('en-KE'),
    body('accountReference', 'Account reference is required').not().isEmpty(),
  ],
  initiateStkPush
);

// M-Pesa STK Push
router.post(
  '/cash',
  protect,
  isSuperAdminOrAdmin,
  [
    body('userId', 'User ID is required').not().isEmpty(),
    body('amount', 'Amount is required').isNumeric(),
    body('transactionId', 'Transaction ID is required').not().isEmpty(),
  ],
  createCashPayment
);

// Wallet Transactions
router.route('/transactions').get(protect, isSuperAdminOrAdmin, getTransactions);
router.route('/wallet').get(protect, isSuperAdminOrAdmin, getWalletTransactions);
router.route('/wallet/user/:id').get(protect, isSuperAdminOrAdmin, getWalletTransactions);
router.post(
  '/wallet',
  protect,
  isSuperAdminOrAdmin,
  [
    body('userId', 'User ID is required').not().isEmpty(),
    body('type', 'Transaction type is required').isIn(['Credit', 'Debit', 'Adjustment']),
    body('amount', 'Amount is required').isNumeric(),
    body('source', 'Source is required').not().isEmpty(),
  ],
  createWalletTransaction
);
router.route('/wallet/:id').get(protect, isSuperAdminOrAdmin, getWalletTransactionById);

module.exports = router;
