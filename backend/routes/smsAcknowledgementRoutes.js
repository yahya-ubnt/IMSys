const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAcknowledgements,
  getAcknowledgementById,
  createAcknowledgement,
  updateAcknowledgement,
  deleteAcknowledgement,
} = require('../controllers/smsAcknowledgementController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdminTenant, getAcknowledgements).post(
  [protect, isSuperAdminOrAdminTenant],
  [
    body('triggerType', 'Trigger type is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
    body('smsTemplate', 'SMS Template ID is required and must be a valid Mongo ID').isMongoId(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createAcknowledgement
);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getAcknowledgementById)
  .put(protect, isSuperAdminOrAdminTenant, updateAcknowledgement)
  .delete(protect, isSuperAdminOrAdminTenant, deleteAcknowledgement);

module.exports = router;
