const express = require('express');
const { query } = require('express-validator');
const {
  getCollectionsSummary,
  getMonthlyCollectionsAndExpenses,
  getMonthlyExpenseSummary,
  getNewSubscriptionsCount,
  getTotalUsersCount,
  getActiveUsersCount,
  getExpiredUsersCount,
} = require('../controllers/dashboardController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

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

// Expenses
router.route('/expenses/monthly-summary').get(protect, isSuperAdminOrAdmin, getMonthlyExpenseSummary);

// Users/Subscriptions
router.route('/subscriptions/new').get(protect, isSuperAdminOrAdmin, getNewSubscriptionsCount);
router.route('/users/total').get(protect, isSuperAdminOrAdmin, getTotalUsersCount);
router.route('/users/active').get(protect, isSuperAdminOrAdmin, getActiveUsersCount);
router.route('/users/expired').get(protect, isSuperAdminOrAdmin, getExpiredUsersCount);

module.exports = router;
