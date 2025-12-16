const express = require('express');
const router = express.Router();
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');
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

router.route('/').post(isSuperAdminOrAdmin, createMikrotikRouter).get(isSuperAdminOrAdmin, getMikrotikRouters);
router.route('/:id').get(isSuperAdminOrAdmin, getMikrotikRouterById).put(isSuperAdminOrAdmin, updateMikrotikRouter).delete(isSuperAdminOrAdmin, deleteMikrotikRouter);
router.route('/:id/status').get(isSuperAdminOrAdmin, getMikrotikRouterStatus);
router.post('/test-connection', isSuperAdminOrAdmin, testMikrotikConnection);

// Routes for fetching Mikrotik specific data
router.route('/:id/ppp-profiles').get(isSuperAdminOrAdmin, getMikrotikPppProfiles);
router.route('/:id/ppp-services').get(isSuperAdminOrAdmin, getMikrotikPppServices);
router.route('/:id/hotspot-servers').get(isSuperAdminOrAdmin, getHotspotServers);
router.route('/:id/hotspot-profiles').get(isSuperAdminOrAdmin, getHotspotProfiles);

module.exports = router;
