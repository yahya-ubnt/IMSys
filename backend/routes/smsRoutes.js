const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
} = require('../controllers/smsController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/triggers').get(protect, isAdminTenant, getSmsTriggers);
router.route('/compose').post(
  [protect, isAdminTenant],
  [
    body('message', 'Message body is required').not().isEmpty(),
    body('sendToType', 'Send To Type is required').isIn(['users', 'mikrotikGroup', 'location', 'unregistered']),
    body('userIds', 'User IDs must be an array of valid Mongo IDs').if(body('sendToType').equals('users')).isArray().custom(value => value.every(item => typeof item === 'string' && item.match(/^[0-9a-fA-F]{24}$/))),
    body('mikrotikRouterId', 'Mikrotik Router ID must be a valid Mongo ID').if(body('sendToType').equals('mikrotikGroup')).isMongoId(),
    body('buildingId', 'Building ID must be a valid Mongo ID').if(body('sendToType').equals('location')).isMongoId(),
    body('unregisteredMobileNumber', 'Mobile number must be valid').if(body('sendToType').equals('unregistered')).matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
  ],
  composeAndSendSms
);
router.route('/log').get(protect, isAdminTenant, getSentSmsLog);
router.route('/log/export').get(protect, isAdminTenant, exportSmsLogs);

module.exports = router;
