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
} = require('../controllers/expenseController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/monthly-total').get(protect, isAdminTenant, getMonthlyExpenseTotal);
router.route('/yearly-monthly-totals').get(protect, isAdminTenant, getYearlyMonthlyExpenseTotals);
router.route('/daily-expense-totals').get(protect, isAdminTenant, getDailyExpenseTotals);
router.route('/').post(
  [protect, isAdminTenant],
  [
    body('title', 'Title is required').not().isEmpty(),
    body('amount', 'Amount must be a number').isNumeric(),
    body('expenseType', 'Expense Type ID is required and must be a valid Mongo ID').isMongoId(),
    body('expenseDate', 'Expense Date is required and must be a valid date').isISO8601().toDate(),
    body('status', 'Invalid status').optional().isIn(['Due', 'Paid']),
  ],
  createExpense
).get(protect, isAdminTenant, getExpenses);
router
  .route('/:id')
  .get(protect, isAdminTenant, getExpenseById)
  .put(protect, isAdminTenant, updateExpense)
  .delete(protect, isAdminTenant, deleteExpense);

module.exports = router;
