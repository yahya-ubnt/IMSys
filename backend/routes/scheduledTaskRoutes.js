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
const { protect, isSuperAdmin, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .get(protect, isSuperAdminOrAdmin, getScheduledTasks)
  .post(
    [protect, isSuperAdmin], // Only SuperAdmins can create new task definitions
    [
      body('name', 'Name is required').not().isEmpty(),
      body('description', 'Description is required').not().isEmpty(),
      body('scriptPath', 'Script path is required').not().isEmpty(),
      body('schedule', 'Schedule (cron format) is required').not().isEmpty(),
    ],
    createScheduledTask
  );

router
  .route('/:id')
  .put(protect, isSuperAdminOrAdmin, updateScheduledTask)
  .delete(protect, isSuperAdmin, deleteScheduledTask); // Only SuperAdmins can delete task definitions

router.route('/:id/run').post(protect, isSuperAdminOrAdmin, runScheduledTask);

module.exports = router;
