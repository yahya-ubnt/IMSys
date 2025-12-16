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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

const scheduleValidation = [
  body('name', 'Name is required').not().isEmpty(),
  body('days', 'Days must be a number').isNumeric(),
  body('timing', 'Invalid timing').isIn(['Before', 'After', 'Not Applicable']),
  body('messageBody', 'Message body is required').not().isEmpty(),
  body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
];

router.route('/').get(isSuperAdminOrAdmin, getSchedules).post(
  isSuperAdminOrAdmin,
  scheduleValidation,
  createSchedule
);
router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getScheduleById)
  .put(
    isSuperAdminOrAdmin,
    scheduleValidation,
    updateSchedule
  )
  .delete(isSuperAdminOrAdmin, deleteSchedule);

module.exports = router;
