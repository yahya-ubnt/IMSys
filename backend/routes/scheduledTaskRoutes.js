const express = require('express');
const router = express.Router();
const {
    getScheduledTasks,
    createScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    runScheduledTask
} = require('../controllers/scheduledTaskController');
const { protect, isSuperAdmin, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/')
    .get(protect, isSuperAdminOrAdmin, getScheduledTasks)
    .post(
        protect,
        isSuperAdmin, // Only SuperAdmins can create new task definitions
        createScheduledTask
    );

router.route('/:id')
    .put(protect, isSuperAdminOrAdmin, updateScheduledTask)
    .delete(protect, isSuperAdmin, deleteScheduledTask); // Only SuperAdmins can delete task definitions

router.route('/:id/run').post(protect, isSuperAdminOrAdmin, runScheduledTask);

module.exports = router;
