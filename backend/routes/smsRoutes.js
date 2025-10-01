const express = require('express');
const router = express.Router();
const {
  composeAndSendSms,
  getSentSmsLog,
  exportSmsLogs,
} = require('../controllers/smsController');
const { protect } = require('../middlewares/protect');

// All routes in this file are protected
router.use(protect);

router.route('/compose').post(composeAndSendSms);
router.route('/log').get(getSentSmsLog);
router.route('/log/export').get(exportSmsLogs);

module.exports = router;
