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
const { protect } = require('../middlewares/protect');

// All routes in this file are protected
router.use(protect);

router.route('/').get(getTemplates).post([
  body('name', 'Template name is required').not().isEmpty(),
  body('messageBody', 'Message body is required').not().isEmpty(),
], createTemplate);
router
  .route('/:id')
  .get(getTemplateById)
  .put(updateTemplate)
  .delete(deleteTemplate);

module.exports = router;
