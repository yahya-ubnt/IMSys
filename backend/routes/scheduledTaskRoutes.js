const express = require('express');
const router = express.Router();
const {
    getScheduledTasks,
    createScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    runScheduledTask
} = require('../controllers/scheduledTaskController');
const { isSuperAdmin, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(isSuperAdminOrAdmin, getScheduledTasks)
    .post(
        [isSuperAdmin], // Only SuperAdmins can create new task definitions
        createScheduledTask
    );

router.route('/:id')
    .put(isSuperAdminOrAdmin, updateScheduledTask)
    .delete(isSuperAdmin, deleteScheduledTask); // Only SuperAdmins can delete task definitions

router.route('/:id/run').post(isSuperAdminOrAdmin, runScheduledTask);

module.exports = router;
