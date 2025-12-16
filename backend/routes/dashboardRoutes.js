const express = require('express');
const { query } = require('express-validator');
const {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getDailyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
  getExpensesSummary,
} = require('../controllers/dashboardController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Collections
router.route('/collections/summary').get(isSuperAdminOrAdmin, getCollectionsSummary);
router.route('/collections-expenses/monthly').get(
  isSuperAdminOrAdmin,
  [
    query('year', 'Year is required').not().isEmpty(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/collections-expenses/daily').get(
  isSuperAdminOrAdmin,
  [
    query('year', 'Year is required').not().isEmpty(),
    query('month', 'Month is required').not().isEmpty(),
  ],
  getDailyCollectionsAndExpenses
);

// Expenses
router.route('/expenses/summary').get(isSuperAdminOrAdmin, getExpensesSummary);
router.route('/expenses/monthly-summary').get(isSuperAdminOrAdmin, getMonthlyExpenseSummary);

// Users/Subscriptions
router.route('/subscriptions/new').get(isSuperAdminOrAdmin, getNewSubscriptionsCount);
router.route('/users/total').get(isSuperAdminOrAdmin, getTotalUsersCount);
router.route('/users/active').get(isSuperAdminOrAdmin, getActiveUsersCount);
router.route('/users/expired').get(isSuperAdminOrAdmin, getExpiredUsersCount);

module.exports = router;
