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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isAdminTenant, getAcknowledgements).post(
  [protect, isAdminTenant],
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
  .get(protect, isAdminTenant, getAcknowledgementById)
  .put(protect, isAdminTenant, updateAcknowledgement)
  .delete(protect, isAdminTenant, deleteAcknowledgement);

module.exports = router;
