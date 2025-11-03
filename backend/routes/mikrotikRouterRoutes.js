const express = require('express');
const router = express.Router();
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');
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
  getHotspotServers,
  getHotspotProfiles,
} = require('../controllers/mikrotikRouterController');

router.route('/').post(protect, isSuperAdminOrAdminTenant, createMikrotikRouter).get(protect, isSuperAdminOrAdminTenant, getMikrotikRouters);
router.route('/:id').get(protect, isSuperAdminOrAdminTenant, getMikrotikRouterById).put(protect, isSuperAdminOrAdminTenant, updateMikrotikRouter).delete(protect, isSuperAdminOrAdminTenant, deleteMikrotikRouter);
router.route('/:id/status').get(protect, isSuperAdminOrAdminTenant, getMikrotikRouterStatus);
router.post('/test-connection', protect, isSuperAdminOrAdminTenant, testMikrotikConnection);

// Routes for fetching Mikrotik specific data
router.route('/:id/ppp-profiles').get(protect, isSuperAdminOrAdminTenant, getMikrotikPppProfiles);
router.route('/:id/ppp-services').get(protect, isSuperAdminOrAdminTenant, getMikrotikPppServices);
router.route('/:id/hotspot-servers').get(protect, isSuperAdminOrAdminTenant, getHotspotServers);
router.route('/:id/hotspot-profiles').get(protect, isSuperAdminOrAdminTenant, getHotspotProfiles);

module.exports = router;
