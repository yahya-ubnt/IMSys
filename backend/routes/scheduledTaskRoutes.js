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
const { protect, isSuperAdmin, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, isSuperAdminOrAdminTenant, getScheduledTasks)
  .post(
    [protect, isSuperAdmin],
    [
      body('name', 'Name is required').not().isEmpty(),
      body('scriptPath', 'Script path is required').not().isEmpty(),
      body('schedule', 'Schedule is required').not().isEmpty(),
    ],
    createScheduledTask
  );

router.route('/:id')
  .put(protect, isSuperAdminOrAdminTenant, updateScheduledTask)
  .delete(protect, isSuperAdmin, deleteScheduledTask);

router.route('/:id/run')
  .post(protect, isSuperAdmin, runScheduledTask);

module.exports = router;
