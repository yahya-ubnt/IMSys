const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSmsTriggers,
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
  getSmsLogsForUser,
} = require('../controllers/smsController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/triggers').get(protect, isSuperAdminOrAdmin, getSmsTriggers);

router.post(
  '/compose',
  protect,
  isSuperAdminOrAdmin,
  [
    body('message', 'Message body is required').not().isEmpty(),
    body('sendToType', 'Send To Type is required').isIn(['users', 'mikrotik', 'location', 'unregistered']),
    body('userIds', 'User IDs must be an array of valid Mongo IDs').if(body('sendToType').equals('users')).isArray().custom(value => value.every(item => typeof item === 'string' && item.match(/^[0-9a-fA-F]{24}$/))),
    body('mikrotikRouterIds', 'Mikrotik Router IDs must be an array').if(body('sendToType').equals('mikrotik')).isArray(),
    body('apartmentHouseNumbers', 'Apartment/House Numbers must be an array').if(body('sendToType').equals('location')).isArray(),
    body('unregisteredMobileNumber', 'Mobile number must be valid').if(body('sendToType').equals('unregistered')).matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
  ],
  composeAndSendSms
);

router.route('/log').get(protect, isSuperAdminOrAdmin, getSentSmsLog);
router.route('/log/export').get(protect, isSuperAdminOrAdmin, exportSmsLogs);
router.route('/logs/user/:userId').get(protect, isSuperAdminOrAdmin, getSmsLogsForUser);

module.exports = router;
