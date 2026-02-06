const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/protect');
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
router.route('/stats').get(protect, isAdmin, getInvoiceStats);
router.route('/').post(protect, isAdmin, createInvoice);

// Routes for the authenticated user (customer or admin)
router.route('/').get(protect, getInvoices);
router.route('/:id').get(protect, getInvoiceById);
router.route('/:id/pdf').get(protect, downloadInvoicePDF); // New route for PDF download
router.route('/:id/pay').post(protect, payInvoice);


module.exports = router;