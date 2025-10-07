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
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/collections/summary').get(protect, getCollectionsSummary);
router.route('/collections-and-expenses/monthly').get(
  protect,
  [
    query('year', 'Year is required and must be a number').isNumeric(),
  ],
  getMonthlyCollectionsAndExpenses
);
router.route('/expenses/monthly-summary').get(protect, getMonthlyExpenseSummary);
router.route('/subscriptions/new').get(protect, getNewSubscriptionsCount);
router.route('/users/total').get(protect, getTotalUsersCount);
router.route('/users/active').get(protect, getActiveUsersCount);
router.route('/users/expired').get(protect, getExpiredUsersCount);

module.exports = router;
