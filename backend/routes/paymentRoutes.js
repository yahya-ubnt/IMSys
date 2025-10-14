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
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/payments/daraja-callback
// @desc    Public callback URL for Daraja API
router.route('/daraja-callback').post(handleDarajaCallback);

// @route   POST /api/payments/initiate-stk
// @desc    Private route to initiate an STK push for a logged-in user
router.route('/initiate-stk').post(
  protect,
  [
    body('amount', 'Amount is required and must be a number').isNumeric(),
    body('phoneNumber', 'Phone number is required and must be valid').matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
    body('accountReference', 'Account reference is required').not().isEmpty(),
  ],
  initiateStkPush
);

// @route   POST /api/payments/cash
// @desc    Private route to record a cash payment
router.route('/cash').post(
  protect,
  [
    body('userId', 'User ID is required and must be a valid Mongo ID').isMongoId(),
    body('amount', 'Amount is required and must be a number').isNumeric(),
    body('transactionId', 'Transaction ID is required').not().isEmpty(),
  ],
  createCashPayment
);

// @route   GET /api/payments/transactions
// @desc    Private route to fetch all transactions
router.route('/transactions').get(protect, getTransactions);

// Wallet Routes
// @route   GET /api/payments/wallet
// @desc    Private route to fetch all wallet transactions
router.route('/wallet').get(protect, getWalletTransactions);

// @route   GET /api/payments/wallet/user/:id
// @desc    Private route to fetch all wallet transactions for a specific user
router.route('/wallet/user/:id').get(protect, getWalletTransactions);

// @route   POST /api/payments/wallet
// @desc    Private route to create a manual wallet transaction
router.route('/wallet').post(
  protect,
  [
    body('userId', 'User ID is required and must be a valid Mongo ID').isMongoId(),
    body('type', 'Transaction type is required').isIn(['Credit', 'Debit', 'Adjustment']),
    body('amount', 'Amount is required and must be a number').isNumeric(),
    body('source', 'Source is required').not().isEmpty(),
    body('comment', 'Comment must be a string').optional().isString(),
    body('transactionId', 'Transaction ID must be a string').optional().isString(),
  ],
  createWalletTransaction
);

// @route   GET /api/payments/wallet/:id
// @desc    Private route to fetch a single wallet transaction by ID
router.route('/wallet/:id').get(protect, getWalletTransactionById);

module.exports = router;
