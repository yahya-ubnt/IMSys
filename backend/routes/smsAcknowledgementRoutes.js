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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdmin, getAcknowledgements).post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('triggerType', 'Trigger type is required').not().isEmpty(),
    body('smsTemplate', 'SMS template is required').not().isEmpty(),
    body('status', 'Status is required').isIn(['Active', 'Inactive']),
  ],
  createAcknowledgement
);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getAcknowledgementById)
  .put(protect, isSuperAdminOrAdmin, updateAcknowledgement)
  .delete(protect, isSuperAdminOrAdmin, deleteAcknowledgement);

module.exports = router;
