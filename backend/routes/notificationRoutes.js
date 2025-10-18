const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdminTenant, getNotifications);
router.route('/:id/read').put(protect, isSuperAdminOrAdminTenant, markAsRead);
router.route('/:id').delete(protect, isSuperAdminOrAdminTenant, deleteNotification);
router.route('/read/all').put(protect, isSuperAdminOrAdminTenant, markAllAsRead);

module.exports = router;
