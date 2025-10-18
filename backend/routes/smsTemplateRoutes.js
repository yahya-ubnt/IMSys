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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isAdminTenant, getTemplates).post([protect, isAdminTenant], [
  body('name', 'Template name is required').not().isEmpty(),
  body('messageBody', 'Message body is required').not().isEmpty(),
], createTemplate);
router
  .route('/:id')
  .get(protect, isAdminTenant, getTemplateById)
  .put(protect, isAdminTenant, updateTemplate)
  .delete(protect, isAdminTenant, deleteTemplate);

module.exports = router;
