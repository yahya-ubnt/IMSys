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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

const scheduleValidation = [
  body('name', 'Name is required').not().isEmpty(),
  body('days', 'Days must be a number').isNumeric(),
  body('timing', 'Invalid timing').isIn(['Before', 'After', 'Not Applicable']),
  body('smsTemplate', 'SMS Template ID is required and must be a valid Mongo ID').isMongoId(),
  body('whatsAppTemplate', 'WhatsApp Template ID must be a valid Mongo ID').optional({ checkFalsy: true }).isMongoId(),
  body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
];

router.route('/').get(protect, isSuperAdminOrAdmin, getSchedules).post(
  protect,
  isSuperAdminOrAdmin,
  scheduleValidation,
  createSchedule
);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getScheduleById)
  .put(
    protect,
    isSuperAdminOrAdmin,
    scheduleValidation,
    updateSchedule
  )
  .delete(protect, isSuperAdminOrAdmin, deleteSchedule);

module.exports = router;
