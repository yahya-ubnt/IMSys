const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionStats, getMonthlyTransactionTotals } = require('../controllers/transactionController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(isSuperAdminOrAdmin, getTransactionStats);
router.route('/monthly-totals').get(isSuperAdminOrAdmin, getMonthlyTransactionTotals);
router.route('/').post(isSuperAdminOrAdmin, createTransaction).get(isSuperAdminOrAdmin, getTransactions);

router
    .route('/:id')
    .get(isSuperAdminOrAdmin, getTransactionById)
    .put(
        isSuperAdminOrAdmin,
        updateTransaction
    )
    .delete(isSuperAdminOrAdmin, deleteTransaction);

module.exports = router;
