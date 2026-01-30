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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('router', 'Router ID is required').not().isEmpty(),
    body('ipAddress', 'IP address is required').not().isEmpty(),
    body('macAddress', 'MAC address is required').not().isEmpty(),
    body('deviceType', 'Device type is required').isIn(['Access', 'Station']),
  ],
  createDevice
).get(protect, isSuperAdminOrAdmin, getDevices);
router.route('/:id').get(protect, isSuperAdminOrAdmin, getDeviceById).put(protect, isSuperAdminOrAdmin, updateDevice).delete(protect, isSuperAdminOrAdmin, deleteDevice);
router.route('/:id/downtime').get(protect, isSuperAdminOrAdmin, getDeviceDowntimeLogs);
router.route('/:stationId/users').get(protect, isSuperAdminOrAdmin, getMikrotikUsersByStation);

module.exports = router;
