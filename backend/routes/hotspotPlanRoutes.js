const express = require('express');
const router = express.Router();
const {
  createHotspotPlan,
  getHotspotPlans,
  getPublicHotspotPlans,
  getHotspotPlanById,
  updateHotspotPlan,
  deleteHotspotPlan,
} = require('../controllers/hotspotPlanController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/public/plans').get(getPublicHotspotPlans);

router
  .route('/')
  .post(protect, isSuperAdminOrAdminTenant, createHotspotPlan)
  .get(protect, isSuperAdminOrAdminTenant, getHotspotPlans);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getHotspotPlanById)
  .put(protect, isSuperAdminOrAdminTenant, updateHotspotPlan)
  .delete(protect, isSuperAdminOrAdminTenant, deleteHotspotPlan);

module.exports = router;
