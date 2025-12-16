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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

// M-Pesa STK Push
router.post(
  '/initiate-stk',
  isSuperAdminOrAdmin,
  [
    body('amount', 'Amount is required').isNumeric(),
    body('phoneNumber', 'Phone number is required').isMobilePhone('en-KE'),
    body('accountReference', 'Account reference is required').not().isEmpty(),
  ],
  initiateStkPush
);

// M-Pesa C2B & STK Callbacks
router.post('/daraja-callback', handleDarajaCallback);

// Cash Payments
router.post(
  '/cash',
  isSuperAdminOrAdmin,
  [
    body('userId', 'User ID is required').not().isEmpty(),
    body('amount', 'Amount is required').isNumeric(),
    body('transactionId', 'Transaction ID is required').not().isEmpty(),
  ],
  createCashPayment
);

// Wallet Transactions
router.route('/transactions').get(isSuperAdminOrAdmin, getTransactions);
router.route('/wallet').get(isSuperAdminOrAdmin, getWalletTransactions);
router.route('/wallet/user/:id').get(isSuperAdminOrAdmin, getWalletTransactions);
router.post(
  '/wallet',
  isSuperAdminOrAdmin,
  [
    body('userId', 'User ID is required').not().isEmpty(),
    body('type', 'Transaction type is required').isIn(['Credit', 'Debit', 'Adjustment']),
    body('amount', 'Amount is required').isNumeric(),
    body('source', 'Source is required').not().isEmpty(),
  ],
  createWalletTransaction
);
router.route('/wallet/:id').get(isSuperAdminOrAdmin, getWalletTransactionById);

module.exports = router;
