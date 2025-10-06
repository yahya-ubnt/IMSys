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
const { protect } = require('../middlewares/authMiddleware');

router.route('/monthly-total').get(protect, getMonthlyExpenseTotal);
router.route('/yearly-monthly-totals').get(protect, getYearlyMonthlyExpenseTotals);
router.route('/daily-expense-totals').get(protect, getDailyExpenseTotals);
router.route('/').post(
  protect,
  [
    body('title', 'Title is required').not().isEmpty(),
    body('amount', 'Amount must be a number').isNumeric(),
    body('expenseType', 'Expense Type ID is required and must be a valid Mongo ID').isMongoId(),
    body('expenseDate', 'Expense Date is required and must be a valid date').isISO8601().toDate(),
    body('status', 'Invalid status').optional().isIn(['Due', 'Paid']),
  ],
  createExpense
).get(protect, getExpenses);
router
  .route('/:id')
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
