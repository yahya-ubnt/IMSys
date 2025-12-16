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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').post(
  isSuperAdminOrAdmin,
  [
    body('router', 'Router ID is required').not().isEmpty(),
    body('ipAddress', 'IP address is required').not().isEmpty(),
    body('macAddress', 'MAC address is required').not().isEmpty(),
    body('deviceType', 'Device type is required').isIn(['Access', 'Station']),
  ],
  createDevice
).get(isSuperAdminOrAdmin, getDevices);
router.route('/:id').get(isSuperAdminOrAdmin, getDeviceById).put(isSuperAdminOrAdmin, updateDevice).delete(isSuperAdminOrAdmin, deleteDevice);
router.route('/:id/downtime').get(isSuperAdminOrAdmin, getDeviceDowntimeLogs);
router.route('/:stationId/users').get(isSuperAdminOrAdmin, getMikrotikUsersByStation);

module.exports = router;
