const express = require('express');
const router = express.Router();
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

router.route('/').get(getSchedules).post(createSchedule);
router
  .route('/:id')
  .get(getScheduleById)
  .put(updateSchedule)
  .delete(deleteSchedule);

module.exports = router;
