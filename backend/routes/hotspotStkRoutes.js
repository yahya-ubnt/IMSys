const express = require('express');
const router = express.Router();
const {
  initiateStkPush,
  handleHotspotCallback,
} = require('../controllers/hotspotStkController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/stk-push').post(protect, initiateStkPush);
router.route('/callback').post(handleHotspotCallback);

module.exports = router;
