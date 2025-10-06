const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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

router.route('/').get(getAcknowledgements).post(
  protect,
  [
    body('triggerType', 'Trigger type is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
    body('smsTemplate', 'SMS Template ID is required and must be a valid Mongo ID').isMongoId(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createAcknowledgement
);
router
  .route('/:id')
  .get(getAcknowledgementById)
  .put(updateAcknowledgement)
  .delete(deleteAcknowledgement);

module.exports = router;
