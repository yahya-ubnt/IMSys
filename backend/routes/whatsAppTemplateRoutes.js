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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .get(protect, isSuperAdminOrAdmin, getWhatsAppTemplates)
  .post(
    protect,
    isSuperAdminOrAdmin,
    [
      body('templateName', 'Template name is required').not().isEmpty(),
      body('providerTemplateId', 'Provider Template ID is required').not().isEmpty(),
      body('body', 'Body is required').not().isEmpty(),
      body('variables', 'Variables must be an array of strings').optional().isArray().custom(value => value.every(item => typeof item === 'string')),
    ],
    createWhatsAppTemplate
  );

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getWhatsAppTemplateById)
  .put(protect, isSuperAdminOrAdmin, updateWhatsAppTemplate)
  .delete(protect, isSuperAdminOrAdmin, deleteWhatsAppTemplate);

module.exports = router;