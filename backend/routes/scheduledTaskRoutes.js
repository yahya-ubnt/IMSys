const express = require('express');
const router = express.Router();
const {
  getScheduledTasks,
  updateScheduledTask,
  createScheduledTask,
  deleteScheduledTask,
  runScheduledTask,
} = require('../controllers/scheduledTaskController');
const { protect, admin } = require('../middlewares/protect');

router.route('/')
  .get(protect, admin, getScheduledTasks)
  .post(protect, admin, createScheduledTask);

router.route('/:id')
  .put(protect, admin, updateScheduledTask)
  .delete(protect, admin, deleteScheduledTask);

router.route('/:id/run')
  .post(protect, admin, runScheduledTask);

module.exports = router;
