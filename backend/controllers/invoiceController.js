const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const ApplicationSettings = require('../models/ApplicationSettings'); // Import ApplicationSettings
const { generateInvoicePDF } = require('../utils/pdfGenerator'); // Import PDF generator

// @desc    Get invoices for the logged-in user OR all invoices for an admin
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const isAdmin = req.user.roles.includes('ADMIN');

  let invoices;

  if (isAdmin) {
    // If user is an admin, fetch all invoices for their tenant
    invoices = await Invoice.find({ tenant: req.user.tenant })
      .populate('mikrotikUser', 'username officialName') // Populate user details for admin view
      .sort({ createdAt: -1 });
  } else {
    // If user is not an admin, fetch only their own invoices
    const mikrotikUser = await MikrotikUser.findOne({ user: req.user._id });

    if (!mikrotikUser) {
      // This user is not a Mikrotik customer, return empty array
      return res.status(200).json([]);
    }
    invoices = await Invoice.find({ mikrotikUser: mikrotikUser._id }).sort({ createdAt: -1 });
  }

  res.status(200).json(invoices);
});

// @desc    Get a single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
  const mikrotikUser = await MikrotikUser.findOne({ user: req.user._id });

  const invoice = await Invoice.findById(req.params.id).populate('mikrotikUser', 'officialName');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Ensure the invoice belongs to the user, unless they are an admin
  const isOwner = mikrotikUser && invoice.mikrotikUser.equals(mikrotikUser._id);
  const isAdmin = req.user.roles.includes('ADMIN');

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }

  res.status(200).json(invoice);
});

// @desc    Get invoice statistics for the admin dashboard
// @route   GET /api/invoices/stats
// @access  Admin
const getInvoiceStats = asyncHandler(async (req, res) => {
    const tenantId = req.user.tenant;

    const totalInvoices = await Invoice.countDocuments({ tenant: tenantId });
    const unpaidInvoices = await Invoice.countDocuments({ tenant: tenantId, status: 'Unpaid' });
    const overdueInvoices = await Invoice.countDocuments({ tenant: tenantId, status: 'Overdue' });

    const totalUnpaidResult = await Invoice.aggregate([
        { $match: { tenant: new mongoose.Types.ObjectId(tenantId), status: { $in: ['Unpaid', 'Overdue'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalUnpaidAmount = totalUnpaidResult.length > 0 ? totalUnpaidResult[0].total : 0;

    res.status(200).json({
        total: totalInvoices,
        unpaid: unpaidInvoices,
        overdue: overdueInvoices,
        totalUnpaidAmount: totalUnpaidAmount,
    });
});

// @desc    Create a manual invoice
// @route   POST /api/invoices
// @access  Admin
const createInvoice = asyncHandler(async (req, res) => {
  const { mikrotikUserId, amount, dueDate, billingPeriodStart, billingPeriodEnd, items } = req.body;

  if (!mikrotikUserId || !amount || !dueDate || !items) {
    res.status(400);
    throw new Error('Please provide all required fields: mikrotikUserId, amount, dueDate, and items');
  }

  const mikrotikUser = await MikrotikUser.findById(mikrotikUserId);
  if (!mikrotikUser) {
    res.status(404);
    throw new Error('Mikrotik user not found');
  }

  // Generate a unique, non-sequential invoice number
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  const randomNumber = Math.floor(1000 + Math.random() * 9000).toString();
  const invoiceNumber = `INV-${dateString}-${randomNumber}`;

  const invoice = await Invoice.create({
    invoiceNumber,
    mikrotikUser: mikrotikUserId,
    tenant: mikrotikUser.tenant,
    amount,
    dueDate,
    billingPeriodStart,
    billingPeriodEnd,
    status: 'Unpaid',
    items,
  });

  // To keep the wallet and invoice systems in sync, we also create a debit transaction
  const newBalance = mikrotikUser.walletBalance - amount;
  await WalletTransaction.create({
    mikrotikUser: mikrotikUserId,
    tenant: mikrotikUser.tenant,
    transactionId: `DEBIT-MANUAL-${Date.now()}`,
    type: 'Debit',
    amount: amount,
    source: 'Manual Invoice',
    balanceAfter: newBalance,
    comment: `Manual invoice charge: ${invoiceNumber}`,
  });

  // And update the user's wallet balance
  mikrotikUser.walletBalance = newBalance;
  await mikrotikUser.save();

  res.status(201).json(invoice);
});

// @desc    Initiate payment for an invoice
// @route   POST /api/invoices/:id/pay
// @access  Private
const payInvoice = asyncHandler(async (req, res) => {
  // Full payment gateway integration is a separate, significant task.
  // This function serves as the endpoint that will trigger that process.
  res.status(501).json({ message: 'Payment gateway not implemented.' });
});

// @desc    Download a single invoice as a PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('mikrotikUser', 'officialName mobileNumber emailAddress');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Security check: Ensure the invoice belongs to the user's tenant
  if (invoice.tenant.toString() !== req.user.tenant.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }

  const settings = await ApplicationSettings.findOne({ tenant: req.user.tenant });
  const tenantSettings = settings ? settings.toObject() : {};

  generateInvoicePDF(invoice, tenantSettings, res);
});


module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  payInvoice,
  getInvoiceStats,
  downloadInvoicePDF,
};
