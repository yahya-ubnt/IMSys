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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post(
  [protect, isSuperAdminOrAdminTenant],
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
).get(protect, isSuperAdminOrAdminTenant, getAllLeads);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getLeadById)
  .put(protect, isSuperAdminOrAdminTenant, updateLead)
  .delete(protect, isSuperAdminOrAdminTenant, deleteLead);

router.route('/status/:id').put(protect, isSuperAdminOrAdminTenant, updateLeadStatus);

module.exports = router;