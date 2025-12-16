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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/public/plans').get(getPublicHotspotPlans);

router
  .route('/')
  .post(isSuperAdminOrAdmin, createHotspotPlan)
  .get(isSuperAdminOrAdmin, getHotspotPlans);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getHotspotPlanById)
  .put(isSuperAdminOrAdmin, updateHotspotPlan)
  .delete(isSuperAdminOrAdmin, deleteHotspotPlan);

module.exports = router;
