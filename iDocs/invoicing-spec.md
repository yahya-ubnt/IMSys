# Invoicing System Specification

## 1. Overview

This document outlines the specification for a formal invoicing system to be built on top of the existing wallet-based billing functionality. The goal is to provide customers with professional, itemized invoices for their subscriptions while maintaining the automated debit/credit logic of the wallet system.

## 2. Core Objectives

- Automate the generation of formal invoices for all active subscribers.
- Provide a clear, professional user interface for customers to view and pay their invoices.
- Create a clear audit trail of billing and payments.
- Ensure seamless reconciliation between payments and invoices.

## 3. Data Model: `Invoice.js`

A new Mongoose model will be created at `backend/models/Invoice.js`.

```javascript
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
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
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
```

## 4. Backend Logic

### 4.1. Invoice Generation

A script will be created to handle invoice generation.

1.  When processing an active subscription, the script will **first** create a new `Invoice` document.
2.  `invoiceNumber` will be generated sequentially (e.g., based on month and a counter).
3.  `status` will be set to `Unpaid`.
4.  `dueDate` will be set based on the subscription's renewal date.
5.  The `items` array will be populated with the subscription details.
6.  **After** the invoice is successfully created, the script will proceed with its original logic of creating the `WalletTransaction` (Debit) and updating the user's `walletBalance`.

### 4.2. Payment Reconciliation

1.  When a payment is successfully processed (e.g., via M-Pesa webhook), the system will identify the user.
2.  It will search for the oldest `Invoice` for that user with a `status` of `Unpaid` or `Overdue`.
3.  The `Invoice` status will be updated to `Paid`.
4.  The `paidDate` and `paymentTransaction` fields will be populated.
5.  The user's `walletBalance` will be credited as it is currently.

### 4.3. API Endpoints (`invoiceRoutes.js`)

New routes will be created:

-   `GET /api/invoices`: (Protected) For a logged-in user to retrieve a list of their own invoices. Supports pagination.
-   `GET /api/invoices/:id`: (Protected) For a user to retrieve the details of a single invoice.
-   `POST /api/invoices/:id/pay`: (Protected) Initiates the payment process for an unpaid invoice (e.g., triggers STK push).
-   `POST /api/invoices`: (Admin-only) For manually creating a one-off invoice for a specific user.

## 5. Frontend UI/UX (`/billing`)

A new page will be created in the frontend application, accessible from the user's dashboard.

### 5.1. Invoice List View

-   A table displaying all invoices.
-   Columns: Invoice #, Date Issued, Due Date, Amount, Status.
-   The "Status" will be a colored badge (e.g., Green for Paid, Red for Unpaid).
-   Each row will have a "View" button. If the invoice is unpaid, a "Pay Now" button will also be present.

### 5.2. Invoice Detail View

-   Clean, professional layout resembling a standard invoice.
-   Displays company and customer details.
-   Itemized list of charges.
-   Total amount due.
-   Clear "Paid" or "Unpaid" status.
-   If unpaid, a prominent "Pay Now" button.
-   A "Download PDF" button.

## 6. Future Enhancements

-   **PDF Generation:** Implement a service to generate PDF versions of invoices for download.
-   **Email/SMS Notifications:** Send notifications when a new invoice is generated or becomes overdue.
-   **Admin View:** An interface for admins to view, manage, and create invoices for any user.

## 7. Admin Functionality

- **Manual Invoice Creation:** A feature in the admin dashboard allowing authorized users to create a one-off invoice for any customer. This would involve a form to select the user, add custom line items and amounts, and set a due date. This is for handling special charges, corrections, or one-time sales. The payment reconciliation for these invoices will be automatic, just like for subscription-based invoices.
