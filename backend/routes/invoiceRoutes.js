const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  getInvoiceStats,
  downloadInvoicePDF,
} = require('../controllers/invoiceController');

// All routes below are protected and require a logged-in user.

// Admin-specific routes
router.route('/stats').get(isAdmin, getInvoiceStats);
router.route('/').post(isAdmin, createInvoice);

// Routes for the authenticated user (customer or admin)
router.route('/').get(getInvoices);
router.route('/:id').get(getInvoiceById);
router.route('/:id/pdf').get(downloadInvoicePDF); // New route for PDF download
router.route('/:id/pay').post(payInvoice);


module.exports = router;