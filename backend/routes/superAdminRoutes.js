const express = require('express');
const router = express.Router();
const { getDashboardStats, getSuperAdminDashboardStats, getRoutersPerTenant, getUsersByPackage } = require('../controllers/superAdminController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');

router.route('/dashboard-stats').get(protect, isSuperAdmin, getDashboardStats);
router.route('/dashboard/stats').get(protect, isSuperAdmin, getSuperAdminDashboardStats);
router.route('/dashboard/routers-per-tenant').get(protect, isSuperAdmin, getRoutersPerTenant);
router.route('/dashboard/users-by-package').get(protect, isSuperAdmin, getUsersByPackage);

module.exports = router;
