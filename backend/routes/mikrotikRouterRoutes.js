const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');
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

router.route('/').post(
    protect, 
    isSuperAdminOrAdmin, 
    [
        body('name', 'Router name is required').not().isEmpty(),
        body('ipAddress', 'A valid IP address is required').isIP(),
        body('apiUsername', 'API username is required').not().isEmpty(),
        body('apiPassword', 'API password is required').not().isEmpty(),
    ],
    createMikrotikRouter)
    .get(protect, isSuperAdminOrAdmin, getMikrotikRouters);
router.route('/:id').get(protect, isSuperAdminOrAdmin, getMikrotikRouterById).put(
    protect, 
    isSuperAdminOrAdmin, 
    [
        body('name', 'Router name must be a string').optional().isString(),
        body('ipAddress', 'A valid IP address is required').optional().isIP(),
        body('apiUsername', 'API username must be a string').optional().isString(),
        body('apiPassword', 'API password must be a string').optional().isString(),
    ],
    updateMikrotikRouter)
    .delete(protect, isSuperAdminOrAdmin, deleteMikrotikRouter);
router.route('/:id/status').get(protect, isSuperAdminOrAdmin, getMikrotikRouterStatus);
router.post('/test-connection', protect, isSuperAdminOrAdmin, testMikrotikConnection);

// Routes for fetching Mikrotik specific data
router.route('/:id/ppp-profiles').get(protect, isSuperAdminOrAdmin, getMikrotikPppProfiles);
router.route('/:id/ppp-services').get(protect, isSuperAdminOrAdmin, getMikrotikPppServices);
router.route('/:id/hotspot-servers').get(protect, isSuperAdminOrAdmin, getHotspotServers);
router.route('/:id/hotspot-profiles').get(protect, isSuperAdminOrAdmin, getHotspotProfiles);

module.exports = router;
