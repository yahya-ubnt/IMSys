const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  getWhatsAppTemplateById,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
} = require('../controllers/whatsAppTemplateController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, isAdminTenant, getWhatsAppTemplates)
  .post(
    [protect, isAdminTenant],
    [
      body('templateName', 'Template name is required').not().isEmpty(),
      body('providerTemplateId', 'Provider Template ID is required').not().isEmpty(),
      body('body', 'Template body is required').not().isEmpty(),
      body('variables', 'Variables must be an array of strings').optional().isArray().custom(value => value.every(item => typeof item === 'string')),
    ],
    createWhatsAppTemplate
  );

router.route('/:id')
  .get(protect, isAdminTenant, getWhatsAppTemplateById)
  .put(protect, isAdminTenant, updateWhatsAppTemplate)
  .delete(protect, isAdminTenant, deleteWhatsAppTemplate);

module.exports = router;