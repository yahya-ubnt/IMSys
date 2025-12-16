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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').post(
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
).get(isSuperAdminOrAdmin, getAllLeads);
router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getLeadById)
  .put(isSuperAdminOrAdmin, updateLead)
  .delete(isSuperAdminOrAdmin, deleteLead);

router.route('/status/:id').put(isSuperAdminOrAdmin, updateLeadStatus);

module.exports = router;