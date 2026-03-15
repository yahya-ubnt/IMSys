# Unified Wallet-Centric Payment System Specification

**Author:** Gemini
**Date:** March 15, 2026
**Status:** Proposed

## 1. Introduction

This document outlines the plan to refactor the application's payment processing logic into a single, unified, wallet-centric system. The goal is to enhance consistency, improve maintainability, and provide a more flexible and robust payment architecture for future growth.

---

## 2. Current State Analysis

The application currently operates with two parallel payment processing systems.

### System 1: The Wallet-Based System

This system uses a user-specific wallet to manage funds and subscriptions.

**Flow:**
1.  A payment is received from a source (e.g., M-Pesa C2B).
2.  The full amount is credited to the `MikrotikUser`'s `walletBalance`.
3.  A `WalletTransaction` of type `Credit` is created for auditing.
4.  The `processSubscriptionPayment` utility then runs, checking the user's subscription status and wallet balance.
5.  If the user is expired and has sufficient funds, the system debits the wallet for one month's service and extends the expiry date.
6.  If the user has a remaining balance, the system purchases future months of service.
7.  `WalletTransaction` records of type `Debit` are created for all subscription purchases.

**Used by:**
*   M-Pesa C2B payments (presumed).
*   Manual admin credits via `createWalletTransaction`.

### System 2: The Direct Activation System

This system bypasses the wallet and directly activates or extends a subscription for a specific package.

**Flow:**
1.  A payment is initiated for a *specific package* from a source (e.g., Cash or STK Push).
2.  The `handleSuccessfulPayment` service is called.
3.  A generic `Transaction` record is created to log the payment.
4.  The `activateUserSubscription` service is called, which directly calculates and sets the new `expiryDate` on the `MikrotikUser` model.
5.  The user's `walletBalance` is not involved in this process.

**Used by:**
*   Cash Payments (`createCashPayment`).
*   M-Pesa STK Push (`initiateStkPush`).

---

## 3. Problems with the Current Architecture

*   **Inconsistency:** The outcome of a payment depends entirely on its source, leading to complex and unpredictable behavior.
*   **Maintenance Overhead:** Having two separate systems means developers need to understand and maintain two different codebases for a single logical domain (payments). This doubles the effort for debugging and feature additions.
*   **Lack of Flexibility:** The Direct Activation system is rigid. It cannot handle overpayments gracefully (the extra money is lost) or accumulate funds from partial payments.
*   **Complex Auditing:** Financial activity is split between two different transaction logs (`WalletTransaction` and `Transaction`), making it difficult to get a single, unified view of a user's payment history.

---

## 4. Proposed Solution: A Unified Wallet-Centric Architecture

We will refactor the entire payment system to follow a single, simple principle: **All payment sources credit the user's wallet.**

The `processSubscriptionPayment` utility, which is already robust and well-tested, will become the sole authority for processing subscriptions from the wallet balance.

**New Unified Flow:**
1.  Payment is received from **any source** (C2B, STK Push, Cash).
2.  The system identifies the user and calls the `processSubscriptionPayment` utility with the amount paid.
3.  `processSubscriptionPayment` performs its standard logic:
    a. Credits the user's `walletBalance`.
    b. Creates a `Credit` `WalletTransaction`.
    c. Pays for expired subscriptions.
    d. Buys future months of service.
    e. Creates `Debit` `WalletTransaction`s.
    f. Re-provisions the user on the Mikrotik router if necessary.

This creates a clean separation of concerns:
*   **Payment Gateways:** Responsible only for receiving money and passing it to the wallet.
*   **Subscription Processor:** Responsible only for managing subscriptions based on the wallet's balance.

---

## 5. Detailed Refactoring Plan

### Step 1: Modify Cash Payments

The `createCashPayment` function in `backend/controllers/paymentController.js` will be changed to use the wallet system.

**File:** `backend/controllers/paymentController.js`

```javascript
// BEFORE
const createCashPayment = asyncHandler(async (req, res) => {
  // ... validation ...
  const { userId, amount, packageId, comment } = req.body;
  const transactionId = `CASH-${randomUUID()}`;

  await PaymentService.handleSuccessfulPayment({
    tenant: req.user.tenant,
    amount: parseFloat(amount),
    transactionId,
    reference: userId,
    packageId: packageId,
    paymentMethod: 'Cash',
    // ...
  });

  res.status(201).json({ success: true, transactionId });
});

// AFTER
const { processSubscriptionPayment } = require('../utils/paymentProcessing');

const createCashPayment = asyncHandler(async (req, res) => {
  // ... validation ...
  const { userId, amount, comment } = req.body; // packageId is no longer needed here
  const externalTransactionId = `CASH-${randomUUID()}`;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await processSubscriptionPayment(
      userId,
      parseFloat(amount),
      'Cash',
      externalTransactionId,
      req.user._id, // adminId
      session
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Cash payment processed successfully.' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cash payment processing failed:', error);
    res.status(500).json({ message: 'Failed to process cash payment.' });
  } finally {
    session.endSession();
  }
});
```

### Step 2: Modify M-Pesa Services

The services handling M-Pesa callbacks must be updated to use `processSubscriptionPayment`.

**File:** `backend/services/mpesaService.js` (Conceptual Change)

The `processStkCallback` and `processC2bCallback` functions currently call `PaymentService.handleSuccessfulPayment` or have similar logic. They must be refactored.

```javascript
// CONCEPTUAL CHANGE for processStkCallback and processC2bCallback

// 1. Find the MikrotikUser based on the callback data (e.g., AccountReference).
const user = await MikrotikUser.findOne({ mPesaRefNo: accountReference });

// 2. Extract payment details.
const amountPaid = callbackData.Amount;
const externalTransactionId = callbackData.MpesaReceiptNumber;

// 3. Start a session and call processSubscriptionPayment.
const session = await mongoose.startSession();
session.startTransaction();
try {
  await processSubscriptionPayment(
    user._id,
    amountPaid,
    'M-Pesa',
    externalTransactionId,
    null, // No adminId for automated payments
    session
  );
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  // ... error handling ...
} finally {
  session.endSession();
}
```

### Step 3: Deprecate and Remove Obsolete Code

To complete the refactoring and prevent future confusion, the now-redundant code must be removed.

1.  **Deprecate `PaymentService.handleSuccessfulPayment`:**
    *   In `backend/services/paymentService.js`, mark the function with a `/** @deprecated */` comment and have it throw an error if called.
2.  **Delete `subscriptionService.js`:**
    *   The file `backend/services/subscriptionService.js` and its `activateUserSubscription` function are no longer needed. The file should be deleted.
3.  **Clean up `paymentController.js`:**
    *   Remove any dependencies on the deprecated services.

---

## 6. Affected Systems

*   **Backend API:**
    *   `POST /api/payments/cash`: The request body for this endpoint will change. It will no longer require a `packageId`.
*   **Frontend:**
    *   Any frontend component that uses the `createCashPayment` endpoint must be updated to reflect the new API contract (i.e., remove the `packageId` field from the form).
*   **Database:**
    *   **No schema changes are required.** This is a major benefit, as the refactoring only affects application logic. The `Transaction` model will still serve as a raw log of incoming payments, while `WalletTransaction` will be the definitive source for user account balance changes.

---

## 7. Testing Plan

A thorough testing plan is critical to ensure a smooth transition.

1.  **Unit Tests:**
    *   Update tests for `createCashPayment` to reflect the new logic.
    *   Write new unit tests for the M-Pesa service functions to ensure they correctly call `processSubscriptionPayment`.
2.  **Integration Tests:**
    *   **Cash Payment:** Test the entire flow from the API call to verifying the user's `walletBalance` and `expiryDate` in the database.
    *   **STK Push:** Simulate an M-Pesa STK callback and verify the entire flow.
    *   **C2B Payment:** Simulate a C2B callback and verify the flow.
3.  **Scenario Testing:**
    *   **New User:** Test a payment for a new user.
    *   **Expired User:** Test a payment for a user whose subscription has lapsed.
    *   **Early Renewal:** Test a payment for a user who is renewing before their expiry date.
    *   **Overpayment:** Test a payment where the amount is more than the package price. Verify the remaining balance is correct.
    *   **Partial Payment:** Test a payment where the amount is less than the package price. Verify the funds are added to the wallet and the subscription is not renewed.
