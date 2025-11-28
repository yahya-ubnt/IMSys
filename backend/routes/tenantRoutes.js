const express = require('express');
const router = express.Router();
const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStats,
  getMonthlyTenantGrowth,
} = require('../controllers/tenantController');
const { protect, isSuperAdmin } = require('../middlewares/authMiddleware');

// All routes in this file are protected and for Super Admins only.
router.use(protect, isSuperAdmin);

router.route('/')
  .post(createTenant)
  .get(getTenants);

router.route('/stats').get(getTenantStats);
router.route('/monthly-growth/:year').get(getMonthlyTenantGrowth);

router.route('/:id')
  .get(getTenantById)
  .put(updateTenant)
  .delete(deleteTenant);

module.exports = router;
