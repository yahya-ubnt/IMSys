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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/collections/summary').get(protect, isAdminTenant, getCollectionsSummary);
router.route('/collections-and-expenses/monthly').get(
  [protect, isAdminTenant],
  [
    query('year', 'Year is required and must be a number').isNumeric(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/expenses/monthly-summary').get(protect, isAdminTenant, getMonthlyExpenseSummary);
router.route('/subscriptions/new').get(protect, isAdminTenant, getNewSubscriptionsCount);
router.route('/users/total').get(protect, isAdminTenant, getTotalUsersCount);
router.route('/users/active').get(protect, isAdminTenant, getActiveUsersCount);
router.route('/users/expired').get(protect, isAdminTenant, getExpiredUsersCount);

module.exports = router;
