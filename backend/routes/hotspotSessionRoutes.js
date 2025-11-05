const express = require('express');
const router = express.Router();
const {
  getSessionStatus,
} = require('../controllers/hotspotSessionController');

router.route('/session/:macAddress').get(getSessionStatus);

module.exports = router;
