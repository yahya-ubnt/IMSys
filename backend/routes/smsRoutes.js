const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
} = require('../controllers/smsController');
const { protect } = require('../middlewares/protect');

// All routes in this file are protected
router.use(protect);

router.route('/compose').post(
  protect,
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
router.route('/log').get(getSentSmsLog);
router.route('/log/export').get(exportSmsLogs);

module.exports = router;
