const express = require('express');
const router = express.Router();
const {
  getAcknowledgements,
  getAcknowledgementById,
  createAcknowledgement,
  updateAcknowledgement,
  deleteAcknowledgement,
} = require('../controllers/smsAcknowledgementController');
const { protect } = require('../middlewares/protect');

// All routes in this file are protected
router.use(protect);

router.route('/').get(getAcknowledgements).post(createAcknowledgement);
router
  .route('/:id')
  .get(getAcknowledgementById)
  .put(updateAcknowledgement)
  .delete(deleteAcknowledgement);

module.exports = router;
