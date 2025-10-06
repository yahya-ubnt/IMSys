const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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
  .post(
    protect,
    admin,
    [
      body('name', 'Name is required').not().isEmpty(),
      body('scriptPath', 'Script path is required').not().isEmpty(),
      body('schedule', 'Schedule is required').not().isEmpty(),
    ],
    createScheduledTask
  );

router.route('/:id')
  .put(protect, admin, updateScheduledTask)
  .delete(protect, admin, deleteScheduledTask);

router.route('/:id/run')
  .post(protect, admin, runScheduledTask);

module.exports = router;
