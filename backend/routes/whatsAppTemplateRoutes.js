const express = require('express');
const router = express.Router();
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
  .post(protect, admin, createWhatsAppTemplate);

router.route('/:id')
  .get(protect, admin, getWhatsAppTemplateById)
  .put(protect, admin, updateWhatsAppTemplate)
  .delete(protect, admin, deleteWhatsAppTemplate);

module.exports = router;