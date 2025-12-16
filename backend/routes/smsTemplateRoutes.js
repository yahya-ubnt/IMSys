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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').get(isSuperAdminOrAdmin, getTemplates).post(
  isSuperAdminOrAdmin,
  [
    body('name', 'Template name is required').not().isEmpty(),
    body('messageBody', 'Message body is required').not().isEmpty(),
  ],
  createTemplate
);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getTemplateById)
  .put(isSuperAdminOrAdmin, updateTemplate)
  .delete(isSuperAdminOrAdmin, deleteTemplate);

module.exports = router;