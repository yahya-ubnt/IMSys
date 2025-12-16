const express = require('express');
const router = express.Router();
const {
  initiateStkPush,
  handleHotspotCallback,
  getHotspotTransactions,
} = require('../controllers/hotspotStkController');

router.route('/').get(getHotspotTransactions);
router.route('/stk-push').post(initiateStkPush);
router.route('/callback').post(handleHotspotCallback);

module.exports = router;
