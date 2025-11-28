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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').get(protect, isSuperAdminOrAdmin, getTemplates).post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('name', 'Template name is required').not().isEmpty(),
    body('messageBody', 'Message body is required').not().isEmpty(),
  ],
  createTemplate
);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getTemplateById)
  .put(protect, isSuperAdminOrAdmin, updateTemplate)
  .delete(protect, isSuperAdminOrAdmin, deleteTemplate);

module.exports = router;