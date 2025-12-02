const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      // Example: "INV-202508-0001"
    },
    mikrotikUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MikrotikUser',
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    billingPeriodStart: {
      type: Date,
    },
    billingPeriodEnd: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['Unpaid', 'Paid', 'Overdue', 'Void'],
      default: 'Unpaid',
    },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    paidDate: {
      type: Date,
    },
    paymentTransaction: {
      // Links to the transaction that paid this invoice
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MpesaTransaction', // Or a more generic 'Transaction' model if available
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
