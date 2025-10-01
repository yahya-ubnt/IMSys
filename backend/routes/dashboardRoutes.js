const express = require('express');
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
router.route('/collections-and-expenses/monthly').get(getMonthlyCollectionsAndExpenses);
router.route('/expenses/monthly-summary').get(getMonthlyExpenseSummary);
router.route('/subscriptions/new').get(getNewSubscriptionsCount);
router.route('/users/total').get(getTotalUsersCount);
router.route('/users/active').get(getActiveUsersCount);
router.route('/users/expired').get(getExpiredUsersCount);

module.exports = router;
