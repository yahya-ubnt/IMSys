const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
} = require('../controllers/leadController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('phoneNumber', 'Phone number is required').not().isEmpty(),
    body('leadSource', 'Lead source is required').isIn([
      'Caretaker/House Manager',
      'Field Sales',
      'Referral',
      'Website',
      
      'Manual Entry',
      'Manual',
    ]),
    body('email', 'Please include a valid email').optional().isEmail(),
  ],
  createLead
).get(protect, isSuperAdminOrAdmin, getAllLeads);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getLeadById)
  .put(protect, isSuperAdminOrAdmin, updateLead)
  .delete(protect, isSuperAdminOrAdmin, deleteLead);

router.route('/status/:id').put(protect, isSuperAdminOrAdmin, updateLeadStatus);

module.exports = router;