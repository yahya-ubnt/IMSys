const express = require('express');
const router = express.Router();
const { getDashboardStats, getSuperAdminDashboardStats, getRoutersPerTenant, getUsersByPackage } = require('../controllers/superAdminController');
const { isSuperAdmin } = require('../middlewares/authMiddleware');

router.route('/dashboard-stats').get(isSuperAdmin, getDashboardStats);
router.route('/dashboard/stats').get(isSuperAdmin, getSuperAdminDashboardStats);
router.route('/dashboard/routers-per-tenant').get(isSuperAdmin, getRoutersPerTenant);
router.route('/dashboard/users-by-package').get(isSuperAdmin, getUsersByPackage);

module.exports = router;
