const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
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

router.route('/').post(protect, createMikrotikRouter).get(protect, getMikrotikRouters);
router.route('/:id').get(protect, getMikrotikRouterById).put(protect, updateMikrotikRouter).delete(protect, deleteMikrotikRouter);
router.route('/:id/status').get(protect, getMikrotikRouterStatus);
router.post('/test-connection', protect, testMikrotikConnection);

// Routes for fetching Mikrotik specific data
router.route('/:id/ppp-profiles').get(protect, getMikrotikPppProfiles);
router.route('/:id/ppp-services').get(protect, getMikrotikPppServices);

module.exports = router;
