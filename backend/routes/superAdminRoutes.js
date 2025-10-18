const express = require('express');
const router = express.Router();
const { getDashboardStats, getTenants, createTenant, getTenantById, updateTenant, deleteTenant } = require('../controllers/superAdminController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');

router.route('/dashboard-stats').get(protect, isSuperAdmin, getDashboardStats);

router.route('/tenants').get(protect, isSuperAdmin, getTenants).post(protect, isSuperAdmin, createTenant);
router.route('/tenants/:id').get(protect, isSuperAdmin, getTenantById).put(protect, isSuperAdmin, updateTenant).delete(protect, isSuperAdmin, deleteTenant);

module.exports = router;
