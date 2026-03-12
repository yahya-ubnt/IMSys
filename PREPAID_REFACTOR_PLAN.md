# Refactoring Plan: Migrating from Post-Paid Billing to a Pre-Paid Subscription Model

## 1. Objective

This document outlines the plan to refactor the core user lifecycle and billing mechanism from the current **post-paid, invoice-based model** to a simpler, more agile **pre-paid, expiry-based subscription model**.

The goal is to eliminate the complexity of bill generation, due dates, and grace periods, and instead tie a user's service access directly to a pre-paid expiry date. This aligns with the desired business model and simplifies the logic for both the system and the end-user.

---

## 2. Current Post-Paid Architecture Analysis

The current system operates like a traditional utility company, which is unnecessarily complex for a pre-paid service.

### Current Flow:
1.  **Bill Generation:** A scheduled job runs at the start of a billing cycle (e.g., monthly) and creates a `Bill` document for every active user.
2.  **Grace Period:** Users have a grace period (e.g., 15 days) to pay this bill. Their service remains active during this time.
3.  **Payment:** Users pay against the generated bill. The `paymentController` marks the `Bill` as 'Paid'.
4.  **Suspension:** A separate daily "reaper" job scans for bills that are past their `dueDate` but are still 'Unpaid'. It then suspends the associated user by setting `isSuspended: true`.

### Key Components:
*   **Models:** `Bill`, `Invoice`.
*   **Controllers:** `billController`, `invoiceController`.
*   **Scheduled Jobs:** A "Bill Generator" job and an "Overdue Bill Reaper" job.

### Shortcomings:
*   **High Complexity:** The logic is spread across multiple controllers and scheduled jobs, making it hard to manage.
*   **Incorrect Model:** This post-paid concept does not match the intended "pay-as-you-go" business requirement.
*   **Poor User Experience:** Users are concerned with "when does my service expire?" not "when is my bill due?".

---

## 3. Proposed Pre-Paid Architecture

The new architecture will be centered around a single, authoritative field on the user model: `expiresAt`.

### New Flow:
1.  **Payment:** A user pays for a specific `Package` (e.g., "30-Day Gold Plan"). There is no pre-existing bill.
2.  **Activation:** Upon successful payment, the system calculates and sets an `expiresAt` date on the `MikrotikUser`'s document (e.g., `now + 30 days`). The user's `isSuspended` flag is set to `false`.
3.  **Service Active:** The user has access to the service until their `expiresAt` date.
4.  **Expiry & Suspension:** A single, daily scheduled job checks for users whose `expiresAt` date is in the past. It suspends these users by setting `isSuspended: true`.
5.  **Renewal:** To get service again, the user simply makes another payment, which sets a new `expiresAt` date.

This model is simpler, more predictable, and directly reflects the transaction between the user and the service.

---

## 4. Detailed Refactoring Roadmap

This refactor will be conducted in phases to ensure a smooth transition.

### Phase 1: Model & Foundation
1.  **Modify `MikrotikUser` Model:**
    *   **Action:** Add a new field: `expiresAt: { type: Date, default: null }`.
    *   **File:** `backend/models/MikrotikUser.js`.
2.  **Create `SubscriptionService`:**
    *   **Action:** Create a new service file to encapsulate the subscription logic. This centralizes the core business rule.
    *   **File:** `backend/services/subscriptionService.js`.
    *   **Content:** It will contain a primary function: `activateUserSubscription(userId, packageId)`.

### Phase 2: Core Logic Implementation
1.  **Refactor `paymentController`:**
    *   **Action:** Modify the payment success logic. Instead of finding and updating a `Bill`, it will now call the new `SubscriptionService`.
    *   **File:** `backend/controllers/paymentController.js`.
    *   **Logic Change:** Upon successful payment, call `subscriptionService.activateUserSubscription(user._id, package._id)`.
2.  **Implement `activateUserSubscription`:**
    *   **Action:** Build the logic within the `SubscriptionService`.
    *   **File:** `backend/services/subscriptionService.js`.
    *   **Logic:**
        *   Find the `Package` to get its duration (e.g., `durationInDays`).
        *   Find the `MikrotikUser`.
        *   Calculate the new `expiresAt` date. **Crucially, if the user is renewing early, this should add duration to their existing `expiresAt` date, not from `now`**.
        *   Update the `MikrotikUser` with `isSuspended: false` and the new `expiresAt`.
        *   Queue a `syncUser` job to ensure the change is immediately reflected on the router.

### Phase 3: Automated Suspension
1.  **Create "Expiry Checker" Job:**
    *   **Action:** Create a new scheduled job that runs once daily.
    *   **File:** `backend/jobs/expiryCheckJob.js` and a corresponding worker.
    *   **Logic:**
        *   Find all `MikrotikUser`s where `isSuspended: false` AND `expiresAt` is in the past.
        *   For each user found, update their document to `isSuspended: true`.
        *   Queue a `syncUser` job for each to disconnect them on the router.
2.  **Disable Old Billing Jobs:**
    *   **Action:** Comment out or remove the schedulers for the old "Bill Generator" and "Overdue Bill Reaper" jobs to prevent them from running.

### Phase 4: Deprecation & Cleanup
1.  **Deprecate Bill/Invoice System:**
    *   **Action:** The `billController` and `invoiceController` are no longer needed for user lifecycle management. They can be removed or repurposed to simply generate receipts for payments made. For now, we will mark them as deprecated.
    *   **Files:** `backend/controllers/billController.js`, `backend/controllers/invoiceController.js`.
2.  **Remove Old Models (Optional):**
    *   **Action:** The `Bill` and `Invoice` models can eventually be removed after ensuring no other part of the system relies on them for historical reporting. This should be done with caution.

---

## 5. Impact Analysis

### Backend
*   **Created Files:**
    *   `backend/services/subscriptionService.js`
    *   `backend/jobs/expiryCheckJob.js`
    *   Associated worker and queue files for the new job.
*   **Modified Files:**
    *   `backend/models/MikrotikUser.js` (add `expiresAt`)
    *   `backend/controllers/paymentController.js` (complete overhaul of logic)
    *   `backend/server.js` or scheduler setup file (to remove old jobs and add the new one).
*   **Deprecated/Removed Files:**
    *   `backend/controllers/billController.js`
    *   `backend/controllers/invoiceController.js`
    *   The old "reaper" and "bill generator" job files.

### Frontend
*   **This is a major impact.** The UI must be updated to reflect the pre-paid model.
*   **Changes Needed:**
    *   The user dashboard should show **"Service expires on [date]"** or **"X Days Remaining"** instead of bill-related information.
    *   Payment sections should be a simple "Buy/Renew Subscription" flow rather than a list of unpaid bills.
    *   All references to "Invoices" and "Bills" in the user-facing context should be removed or changed to "Payment History".

### Data Migration
*   **A one-time data migration script will be required.**
*   **Action:** This script will need to be run once to transition all existing users.
*   **Logic:** It will iterate through all users who are currently `isSuspended: false`. For each user, it will look at their last paid bill to estimate a fair `expiresAt` date and populate the new field. For users who are `isSuspended: true`, their `expiresAt` can be set to a date in the past.

---

## 6. Verification Plan

1.  **Payment Flow:**
    *   Verify that a new payment for a suspended user correctly sets their `expiresAt` and reconnects them.
    *   Verify that an early renewal for an active user correctly extends their existing `expiresAt`.
2.  **Expiry Flow:**
    *   Manually set a user's `expiresAt` to a time in the past and trigger the expiry job. Verify the user is suspended in the database and on the router.
3.  **UI:**
    *   Confirm the frontend correctly displays the new expiry date and renewal options.
4.  **Regression:**
    *   Ensure the manual disconnect/reconnect functionality for admins still works as expected.
