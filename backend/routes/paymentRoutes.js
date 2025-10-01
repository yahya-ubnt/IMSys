const express = require('express');
const router = express.Router();
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
router.route('/initiate-stk').post(protect, initiateStkPush);

// @route   POST /api/payments/cash
// @desc    Private route to record a cash payment
router.route('/cash').post(protect, createCashPayment);

// @route   GET /api/payments/transactions
// @desc    Private route to fetch all transactions
router.route('/transactions').get(protect, getTransactions);

// Wallet Routes
// @route   GET /api/payments/wallet
// @desc    Private route to fetch all wallet transactions
router.route('/wallet').get(protect, getWalletTransactions);

// @route   POST /api/payments/wallet
// @desc    Private route to create a manual wallet transaction
router.route('/wallet').post(protect, createWalletTransaction);

// @route   GET /api/payments/wallet/:id
// @desc    Private route to fetch a single wallet transaction by ID
router.route('/wallet/:id').get(protect, getWalletTransactionById);

module.exports = router;
