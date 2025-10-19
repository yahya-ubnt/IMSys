const express = require('express');
const router = express.Router();
const { getDashboardStats, getSuperAdminDashboardStats, getTenantStats, getMonthlyTenantGrowth, getTenants, createTenant, getTenantById, updateTenant, deleteTenant, getRoutersPerTenant, getUsersByPackage } = require('../controllers/superAdminController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');

router.route('/dashboard-stats').get(protect, isSuperAdmin, getDashboardStats);
router.route('/dashboard/stats').get(protect, isSuperAdmin, getSuperAdminDashboardStats);
router.route('/dashboard/routers-per-tenant').get(protect, isSuperAdmin, getRoutersPerTenant);
router.route('/dashboard/users-by-package').get(protect, isSuperAdmin, getUsersByPackage);

router.route('/tenants/stats').get(protect, isSuperAdmin, getTenantStats);
router.route('/tenants/monthly-growth/:year').get(protect, isSuperAdmin, getMonthlyTenantGrowth);
router.route('/tenants').get(protect, isSuperAdmin, getTenants).post(protect, isSuperAdmin, createTenant);
router.route('/tenants/:id').get(protect, isSuperAdmin, getTenantById).put(protect, isSuperAdmin, updateTenant).delete(protect, isSuperAdmin, deleteTenant);

module.exports = router;
