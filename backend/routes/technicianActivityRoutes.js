const express = require('express');
const router = express.Router();
const {
  createTechnicianActivity,
  getTechnicianActivities,
  getTechnicianActivityById,
  updateTechnicianActivity,
  deleteTechnicianActivity,
} = require('../controllers/technicianActivityController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createTechnicianActivity).get(protect, getTechnicianActivities);
router
  .route('/:id')
  .get(protect, getTechnicianActivityById)
  .put(protect, updateTechnicianActivity)
  .delete(protect, deleteTechnicianActivity);

module.exports = router;