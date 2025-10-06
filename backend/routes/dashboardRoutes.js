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

const router = express.Router();

router.route('/collections/summary').get(getCollectionsSummary);
router.route('/collections-and-expenses/monthly').get(
  [
    query('year', 'Year is required and must be a number').isNumeric(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/expenses/monthly-summary').get(getMonthlyExpenseSummary);
router.route('/subscriptions/new').get(getNewSubscriptionsCount);
router.route('/users/total').get(getTotalUsersCount);
router.route('/users/active').get(getActiveUsersCount);
router.route('/users/expired').get(getExpiredUsersCount);

module.exports = router;
