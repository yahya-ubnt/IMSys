const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionStats, getMonthlyTransactionTotals } = require('../controllers/transactionController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/stats').get(protect, isSuperAdminOrAdmin, getTransactionStats);
router.route('/monthly-totals').get(protect, isSuperAdminOrAdmin, getMonthlyTransactionTotals);
router.route('/').post(protect, isSuperAdminOrAdmin, createTransaction).get(protect, isSuperAdminOrAdmin, getTransactions);

router
    .route('/:id')
    .get(protect, isSuperAdminOrAdmin, getTransactionById)
    .put(
        protect,
        isSuperAdminOrAdmin,
        updateTransaction
    )
    .delete(protect, isSuperAdminOrAdmin, deleteTransaction);

module.exports = router;
