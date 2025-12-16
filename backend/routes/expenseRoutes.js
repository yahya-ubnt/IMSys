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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/stats').get(isSuperAdminOrAdmin, getExpenseStats);
router.route('/monthly-total').get(isSuperAdminOrAdmin, getMonthlyExpenseTotal);
router.route('/yearly-monthly-totals').get(isSuperAdminOrAdmin, getYearlyMonthlyExpenseTotals);
router.route('/daily-expense-totals').get(isSuperAdminOrAdmin, getDailyExpenseTotals);

router.route('/').post(
  isSuperAdminOrAdmin,
  [
    body('date', 'Date is required').isISO8601().toDate(),
    body('type', 'Type is required').not().isEmpty(),
    body('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
    body('description', 'Description is required').not().isEmpty(),
  ],
  createExpense
).get(isSuperAdminOrAdmin, getExpenses);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getExpenseById)
  .put(isSuperAdminOrAdmin, updateExpense)
  .delete(isSuperAdminOrAdmin, deleteExpense);

module.exports = router;

