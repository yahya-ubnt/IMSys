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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post(
  [protect, isAdminTenant],
  [
    body('phoneNumber', 'Phone number is required').not().isEmpty(),
    body('leadSource', 'Lead source is required').isIn([
      'Caretaker/House Manager',
      'Field Sales',
      'Referral',
      'Website',
      'WhatsApp/SMS',
      'Manual Entry',
      'Manual',
    ]),
    body('email', 'Please include a valid email').optional().isEmail(),
  ],
  createLead
).get(protect, isAdminTenant, getAllLeads);
router
  .route('/:id')
  .get(protect, isAdminTenant, getLeadById)
  .put(protect, isAdminTenant, updateLead)
  .delete(protect, isAdminTenant, deleteLead);

router.route('/status/:id').put(protect, isAdminTenant, updateLeadStatus);

module.exports = router;