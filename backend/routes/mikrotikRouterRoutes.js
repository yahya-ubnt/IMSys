const express = require('express');
const router = express.Router();
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');
const {
  createMikrotikRouter,
  getMikrotikRouters,
  getMikrotikRouterById,
  updateMikrotikRouter,
  deleteMikrotikRouter,
  testMikrotikConnection,
  getMikrotikPppProfiles,
  getMikrotikPppServices,
  getMikrotikRouterStatus,
} = require('../controllers/mikrotikRouterController');

router.route('/').post(protect, isAdminTenant, createMikrotikRouter).get(protect, isAdminTenant, getMikrotikRouters);
router.route('/:id').get(protect, isAdminTenant, getMikrotikRouterById).put(protect, isAdminTenant, updateMikrotikRouter).delete(protect, isAdminTenant, deleteMikrotikRouter);
router.route('/:id/status').get(protect, isAdminTenant, getMikrotikRouterStatus);
router.post('/test-connection', protect, isAdminTenant, testMikrotikConnection);

// Routes for fetching Mikrotik specific data
router.route('/:id/ppp-profiles').get(protect, isAdminTenant, getMikrotikPppProfiles);
router.route('/:id/ppp-services').get(protect, isAdminTenant, getMikrotikPppServices);

module.exports = router;
