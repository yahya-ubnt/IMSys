const express = require('express');
const router = express.Router();
const {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getDeviceDowntimeLogs,
} = require('../controllers/deviceController');
const { getMikrotikUsersByStation } = require('../controllers/mikrotikUserController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes are protected and require admin privileges
router.use(protect, admin);

router.route('/').post(createDevice).get(getDevices);
router.route('/:id').get(getDeviceById).put(updateDevice).delete(deleteDevice);
router.route('/:id/downtime').get(getDeviceDowntimeLogs);
router.route('/:stationId/users').get(getMikrotikUsersByStation);

module.exports = router;
