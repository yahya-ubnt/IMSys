const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  markAllAsRead,
} = require('../controllers/notificationController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').get(isSuperAdminOrAdmin, getNotifications);
router.route('/:id/read').put(isSuperAdminOrAdmin, markAsRead);
router.route('/:id').delete(isSuperAdminOrAdmin, deleteNotification);
router.route('/read/all').put(isSuperAdminOrAdmin, markAllAsRead);

module.exports = router;
