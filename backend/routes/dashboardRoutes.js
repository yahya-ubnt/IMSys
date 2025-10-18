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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/collections/summary').get(protect, isSuperAdminOrAdminTenant, getCollectionsSummary);
router.route('/collections-and-expenses/monthly').get(
  [protect, isSuperAdminOrAdminTenant],
  [
    query('year', 'Year is required and must be a number').isNumeric(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/expenses/monthly-summary').get(protect, isSuperAdminOrAdminTenant, getMonthlyExpenseSummary);
router.route('/subscriptions/new').get(protect, isSuperAdminOrAdminTenant, getNewSubscriptionsCount);
router.route('/users/total').get(protect, isSuperAdminOrAdminTenant, getTotalUsersCount);
router.route('/users/active').get(protect, isSuperAdminOrAdminTenant, getActiveUsersCount);
router.route('/users/expired').get(protect, isSuperAdminOrAdminTenant, getExpiredUsersCount);

module.exports = router;
