const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseTotal,
  getYearlyMonthlyExpenseTotals,
  getDailyExpenseTotals,
  getExpenseStats,
} = require('../controllers/expenseController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(protect, isSuperAdminOrAdmin, getExpenseStats);
router.route('/monthly-total').get(protect, isSuperAdminOrAdmin, getMonthlyExpenseTotal);
router.route('/yearly-monthly-totals').get(protect, isSuperAdminOrAdmin, getYearlyMonthlyExpenseTotals);
router.route('/daily-expense-totals').get(protect, isSuperAdminOrAdmin, getDailyExpenseTotals);

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('title', 'Title is required').not().isEmpty(),
    body('amount', 'Amount must be a number').isNumeric(),
    body('expenseType', 'Expense type is required').not().isEmpty(),
    body('expenseDate', 'Expense date is required').isISO8601(),
  ],
  createExpense
).get(protect, isSuperAdminOrAdmin, getExpenses);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getExpenseById)
  .put(protect, isSuperAdminOrAdmin, updateExpense)
  .delete(protect, isSuperAdminOrAdmin, deleteExpense);

module.exports = router;
