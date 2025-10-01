const express = require('express');
const router = express.Router();
const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
} = require('../controllers/leadController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createLead).get(protect, getAllLeads);
router
  .route('/:id')
  .get(protect, getLeadById)
  .put(protect, admin, updateLead)
  .delete(protect, admin, deleteLead);

router.route('/status/:id').put(protect, updateLeadStatus);

module.exports = router;