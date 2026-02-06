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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/public/plans').get(getPublicHotspotPlans);

router
  .route('/')
  .post(protect, isSuperAdminOrAdmin, createHotspotPlan)
  .get(protect, isSuperAdminOrAdmin, getHotspotPlans);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getHotspotPlanById)
  .put(protect, isSuperAdminOrAdmin, updateHotspotPlan)
  .delete(protect, isSuperAdminOrAdmin, deleteHotspotPlan);

module.exports = router;
