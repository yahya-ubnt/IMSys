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
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').post(
  protect,
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
).get(protect, getAllLeads);
router
  .route('/:id')
  .get(protect, getLeadById)
  .put(protect, admin, updateLead)
  .delete(protect, admin, deleteLead);

router.route('/status/:id').put(protect, updateLeadStatus);

module.exports = router;