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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

const scheduleValidation = [
  body('name', 'Name is required').not().isEmpty(),
  body('days', 'Days must be a number').isNumeric(),
  body('timing', 'Invalid timing').isIn(['Before', 'After', 'Not Applicable']),
  body('messageBody', 'Message body is required').not().isEmpty(),
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
