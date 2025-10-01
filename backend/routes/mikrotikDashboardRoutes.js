const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getRouterStatus,
  getRouterInterfaces,
  getInterfaceTraffic, // Added
  getActivePppoeSessions,
  disconnectPppoeUser,
  getPppoeSecrets,
  addPppoeSecret,
  updatePppoeSecret,
  deletePppoeSecret,
  getQueues,
  getFirewallFilters,
  getDhcpLeases,
  getLogs,
  addQueue,
  updateQueue,
  deleteQueue,
  getPppoeUserCounts,
  getStaticUserCounts,
} = require('../controllers/mikrotikDashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { connectToRouter } = require('../middlewares/mikrotikDashboardMiddleware');

// Apply middleware for all routes in this file
router.use(protect, connectToRouter);

router.route('/status').get(getRouterStatus);
router.route('/interfaces').get(getRouterInterfaces);
router.route('/pppoe/active').get(getActivePppoeSessions);
router.route('/pppoe/active/disconnect').post(disconnectPppoeUser);
router.route('/pppoe/secrets').get(getPppoeSecrets).post(addPppoeSecret);
router
  .route('/pppoe/secrets/:secretId')
  .put(updatePppoeSecret)
  .delete(deletePppoeSecret);
router.route('/queues').get(getQueues).post(addQueue);
router
  .route('/queues/:queueId')
  .put(updateQueue)
  .delete(deleteQueue);
router.route('/firewall/filter').get(getFirewallFilters);
router.route('/dhcp-leases').get(getDhcpLeases);
router.route('/logs').get(getLogs);
router.route('/pppoe/counts').get(getPppoeUserCounts); // New route
router.route('/static/counts').get(getStaticUserCounts); // New route
router.route('/traffic/:interfaceName').get(getInterfaceTraffic); // New route for traffic monitoring

module.exports = router;