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
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, admin, getWhatsAppTemplates)
  .post(
    protect,
    admin,
    [
      body('templateName', 'Template name is required').not().isEmpty(),
      body('providerTemplateId', 'Provider Template ID is required').not().isEmpty(),
      body('body', 'Template body is required').not().isEmpty(),
      body('variables', 'Variables must be an array of strings').optional().isArray().custom(value => value.every(item => typeof item === 'string')),
    ],
    createWhatsAppTemplate
  );

router.route('/:id')
  .get(protect, admin, getWhatsAppTemplateById)
  .put(protect, admin, updateWhatsAppTemplate)
  .delete(protect, admin, deleteWhatsAppTemplate);

module.exports = router;