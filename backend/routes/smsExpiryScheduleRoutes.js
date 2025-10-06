const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/smsExpiryScheduleController');
const { protect } = require('../middlewares/protect');

// All routes in this file are protected
router.use(protect);

router.route('/').get(getSchedules).post(
  protect,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('days', 'Days must be a number').isNumeric(),
    body('timing', 'Invalid timing').isIn(['Before', 'After', 'Not Applicable']),
    body('smsTemplate', 'SMS Template ID is required and must be a valid Mongo ID').isMongoId(),
    body('whatsAppTemplate', 'WhatsApp Template ID must be a valid Mongo ID').optional().isMongoId(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createSchedule
);
router
  .route('/:id')
  .get(getScheduleById)
  .put(updateSchedule)
  .delete(deleteSchedule);

module.exports = router;
