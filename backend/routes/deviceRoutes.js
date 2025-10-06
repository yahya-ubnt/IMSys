const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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

router.route('/').post([
  body('router', 'Router ID is required').isMongoId(),
  body('ipAddress', 'A valid IP address is required').isIP(),
  body('macAddress', 'A valid MAC address is required').isMACAddress(),
  body('deviceType', 'Device type is required').isIn(['Access', 'Station']),
], createDevice).get(getDevices);
router.route('/:id').get(getDeviceById).put(updateDevice).delete(deleteDevice);
router.route('/:id/downtime').get(getDeviceDowntimeLogs);
router.route('/:stationId/users').get(getMikrotikUsersByStation);

module.exports = router;
