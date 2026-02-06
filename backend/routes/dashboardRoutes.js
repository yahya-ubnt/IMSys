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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

const router = express.Router();

// Collections
router.route('/collections/summary').get(protect, isSuperAdminOrAdmin, getCollectionsSummary);
router.route('/collections-expenses/monthly').get(
  protect,
  isSuperAdminOrAdmin,
  [
    query('year', 'Year is required').not().isEmpty(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/collections-expenses/daily').get(
  protect,
  isSuperAdminOrAdmin,
  [
    query('year', 'Year is required').not().isEmpty(),
    query('month', 'Month is required').not().isEmpty(),
  ],
  getDailyCollectionsAndExpenses
);

// Expenses
router.route('/expenses/summary').get(protect, isSuperAdminOrAdmin, getExpensesSummary);
router.route('/expenses/monthly-summary').get(protect, isSuperAdminOrAdmin, getMonthlyExpenseSummary);

// Users/Subscriptions
router.route('/subscriptions/new').get(protect, isSuperAdminOrAdmin, getNewSubscriptionsCount);
router.route('/users/total').get(protect, isSuperAdminOrAdmin, getTotalUsersCount);
router.route('/users/active').get(protect, isSuperAdminOrAdmin, getActiveUsersCount);
router.route('/users/expired').get(protect, isSuperAdminOrAdmin, getExpiredUsersCount);

module.exports = router;
