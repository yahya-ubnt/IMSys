const express = require('express');
const router = express.Router();
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
router.route('/').post(protect, createExpense).get(protect, getExpenses);
router
  .route('/:id')
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
