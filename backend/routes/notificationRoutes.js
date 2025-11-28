const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdmin, getNotifications);
router.route('/:id/read').put(protect, isSuperAdminOrAdmin, markAsRead);
router.route('/:id').delete(protect, isSuperAdminOrAdmin, deleteNotification);
router.route('/read/all').put(protect, isSuperAdminOrAdmin, markAllAsRead);

module.exports = router;
