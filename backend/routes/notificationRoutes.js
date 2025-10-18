const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isAdminTenant, getNotifications);
router.route('/:id/read').put(protect, isAdminTenant, markAsRead);
router.route('/:id').delete(protect, isAdminTenant, deleteNotification);
router.route('/read/all').put(protect, isAdminTenant, markAllAsRead);

module.exports = router;
