const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getMonthlyExpenseTotal,
  getYearlyMonthlyExpenseTotals,
  getDailyExpenseTotals,
} = require('../controllers/expenseController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/stats').get(protect, isSuperAdminOrAdmin, getExpenseStats);
router.route('/monthly-total').get(protect, isSuperAdminOrAdmin, getMonthlyExpenseTotal);
router.route('/yearly-monthly-totals').get(protect, isSuperAdminOrAdmin, getYearlyMonthlyExpenseTotals);
router.route('/daily-expense-totals').get(protect, isSuperAdminOrAdmin, getDailyExpenseTotals);

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('date', 'Date is required').isISO8601().toDate(),
    body('type', 'Type is required').not().isEmpty(),
    body('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
    body('description', 'Description is required').not().isEmpty(),
  ],
  createExpense
).get(protect, isSuperAdminOrAdmin, getExpenses);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getExpenseById)
  .put(protect, isSuperAdminOrAdmin, updateExpense)
  .delete(protect, isSuperAdminOrAdmin, deleteExpense);

module.exports = router;

