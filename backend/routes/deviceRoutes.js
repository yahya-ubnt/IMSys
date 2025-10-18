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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post([protect, isAdminTenant], [
  body('router', 'Router ID is required').isMongoId(),
  body('ipAddress', 'A valid IP address is required').isIP(),
  body('macAddress', 'A valid MAC address is required').isMACAddress(),
  body('deviceType', 'Device type is required').isIn(['Access', 'Station']),
], createDevice).get(protect, isAdminTenant, getDevices);
router.route('/:id').get(protect, isAdminTenant, getDeviceById).put(protect, isAdminTenant, updateDevice).delete(protect, isAdminTenant, deleteDevice);
router.route('/:id/downtime').get(protect, isAdminTenant, getDeviceDowntimeLogs);
router.route('/:stationId/users').get(protect, isAdminTenant, getMikrotikUsersByStation);

module.exports = router;
