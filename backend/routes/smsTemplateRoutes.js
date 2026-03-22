const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSmsTriggersWithVariables, // Import the new function
} = require('../controllers/smsTemplateController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/').get(protect, isSuperAdminOrAdmin, getTemplates).post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('triggerType', 'Trigger type is required').not().isEmpty(),
    body('messageBody', 'Message body is required').not().isEmpty(),
    body('status').optional().isIn(['Active', 'Inactive']),
  ],
  createTemplate
);

// New route to get SMS triggers with their variables
router.route('/triggers').get(protect, isSuperAdminOrAdmin, getSmsTriggersWithVariables);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getTemplateById)
  .put(protect, isSuperAdminOrAdmin, updateTemplate)
  .delete(protect, isSuperAdminOrAdmin, deleteTemplate);

module.exports = router;