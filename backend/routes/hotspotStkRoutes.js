const express = require('express');
const router = express.Router();
const {
  initiateStkPush,
  handleHotspotCallback,
  getHotspotTransactions,
} = require('../controllers/hotspotStkController');

const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/').get(protect, isSuperAdminOrAdmin, getHotspotTransactions);
router.route('/stk-push').post(protect, initiateStkPush);
router.route('/callback').post(handleHotspotCallback);

module.exports = router;
