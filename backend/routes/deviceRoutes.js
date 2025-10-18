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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post([protect, isSuperAdminOrAdminTenant], [
  body('router', 'Router ID is required').isMongoId(),
  body('ipAddress', 'A valid IP address is required').isIP(),
  body('macAddress', 'A valid MAC address is required').isMACAddress(),
  body('deviceType', 'Device type is required').isIn(['Access', 'Station']),
], createDevice).get(protect, isSuperAdminOrAdminTenant, getDevices);
router.route('/:id').get(protect, isSuperAdminOrAdminTenant, getDeviceById).put(protect, isSuperAdminOrAdminTenant, updateDevice).delete(protect, isSuperAdminOrAdminTenant, deleteDevice);
router.route('/:id/downtime').get(protect, isSuperAdminOrAdminTenant, getDeviceDowntimeLogs);
router.route('/:stationId/users').get(protect, isSuperAdminOrAdminTenant, getMikrotikUsersByStation);

module.exports = router;
