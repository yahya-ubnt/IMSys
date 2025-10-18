const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/smsTemplateController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdminTenant, getTemplates).post([protect, isSuperAdminOrAdminTenant], [
  body('name', 'Template name is required').not().isEmpty(),
  body('messageBody', 'Message body is required').not().isEmpty(),
], createTemplate);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getTemplateById)
  .put(protect, isSuperAdminOrAdminTenant, updateTemplate)
  .delete(protect, isSuperAdminOrAdminTenant, deleteTemplate);

module.exports = router;
