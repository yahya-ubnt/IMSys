# Refactoring Plan: Migrating from Post-Paid Billing to a Pre-Paid Subscription Model
## [INVESTIGATION UPDATE] This document has been updated based on a detailed code investigation.

## 1. Objective

This document outlines the plan to refactor the core user lifecycle and billing mechanism from the current **post-paid, invoice-based model** to a simpler, more agile **pre-paid, expiry-based subscription model**.

The goal is to eliminate the complexity of bill generation, due dates, and grace periods, and instead tie a user's service access directly to a pre-paid expiry date. This aligns with the desired business model and simplifies the logic for both the system and the end-user.

---

## 2. Current Post-Paid Architecture Analysis

The current system operates like a traditional utility company, which is unnecessarily complex for a pre-paid service.

### Current Flow:
1.  **Bill Generation:** A scheduled job (`generateMonthlyBilling`) runs and creates a `Bill` document for every active user.
2.  **Payment:** Users pay against the generated bill. The `paymentController` marks the `Bill` as 'Paid'. This is the primary logic that needs to be changed.
3.  **Suspension:** A separate, robust system (the `scheduledTaskWorker`) finds users whose `expiryDate` has passed and suspends them.

### Shortcomings:
*   **Incorrect Model:** The payment and billing-generation logic follows a post-paid concept that does not match the intended "pay-as-you-go" business requirement.
*   **Poor User Experience:** Users are concerned with "when does my service expire?" not "when is my bill due?".

---

## 3. Proposed Pre-Paid Architecture

The new architecture will be centered around a single, authoritative field on the user model: `expiryDate`.

### New Flow:
1.  **Payment:** A user pays for a specific `Package` (e.g., "30-Day Gold Plan"). There is no pre-existing bill.
2.  **Activation:** Upon successful payment, the system calculates and sets an `expiryDate` on the `MikrotikUser`'s document (e.g., `now + 30 days`). The user's `isSuspended` flag is set to `false`.
3.  **Service Active:** The user has access to the service until their `expiryDate`.
4.  **Expiry & Suspension:** A sophisticated, multi-stage scheduled job already exists to handle this. It checks for users whose `expiryDate` is in the past and suspends them by setting `isSuspended: true`.
5.  **Renewal:** To get service again, the user simply makes another payment, which sets a new `expiryDate`.

This model is simpler, more predictable, and directly reflects the transaction between the user and the service.

---

## 4. Detailed Refactoring Roadmap

This refactor will be conducted in phases to ensure a smooth transition.

### Phase 1: Model & Foundation [COMPLETED]
*   **[INVESTIGATION UPDATE]** Our investigation confirmed that the `MikrotikUser` model **already contains** the necessary field: `expiryDate: { type: Date, required: true }`.
*   **Conclusion:** No database model changes are required for this phase.

### Phase 1.5: Schema Correction [COMPLETED]
*   **[INVESTIGATION UPDATE]** Further investigation revealed that the `Package` model was missing a field to define the duration of the subscription. This is a critical gap, as the subscription logic relies on packages having a defined duration.
*   **Action:** Add a `durationInDays: { type: Number, required: true }` field to the `Package` schema in `backend/models/Package.js`.
*   **Action:** Update the `packageController.js` to support creating and editing the new `durationInDays` field.
*   **Conclusion:** These changes ensure that the data model can support the core requirements of the prepaid refactor.

### Phase 2: Core Logic Implementation [THIS IS OUR FOCUS]
1.  **Create `SubscriptionService`:**
    *   **Action:** Create a new service file to encapsulate the subscription logic. This centralizes the core business rule.
    *   **File:** `backend/services/subscriptionService.js`.
    *   **Content:** It will contain a primary function: `activateUserSubscription(userId, packageId)`.
2.  **Implement `activateUserSubscription`:**
    *   **Action:** Build the logic within the `SubscriptionService`.
    *   **File:** `backend/services/subscriptionService.js`.
    *   **Logic:**
        *   Find the `Package` to get its duration (e.g., `durationInDays`).
        *   Find the `MikrotikUser`.
        *   Calculate the new `expiryDate`. **Crucially, if the user is renewing early, this should add duration to their existing `expiryDate`, not from `now`**.
        *   Update the `MikrotikUser` with `isSuspended: false` and the new `expiryDate`.
        *   Queue a `syncUser` job to ensure the change is immediately reflected on the router.
3.  **Refactor `paymentController`:**
    *   **Action:** Modify the payment success logic. Instead of finding and updating a `Bill`, it will now call the new `subscriptionService`.
    *   **File:** `backend/controllers/paymentController.js`.
    *   **Logic Change:** Upon successful payment, call `subscriptionService.activateUserSubscription(user._id, package._id)`.

### Phase 3: Automated Suspension [COMPLETED]
*   **[INVESTIGATION UPDATE]** A robust, multi-stage system for automated suspension already exists. It is superior to the original proposal.
*   **Existing Architecture:**
    1.  **Scheduler:** `backend/scripts/masterScheduler.js` runs on startup and schedules all enabled tasks from the `ScheduledTask` model using `node-cron`.
    2.  **Trigger:** The "Automated Disconnection" task is configured to run the `backend/scripts/triggerDisconnectWorker.js` script.
    3.  **Queueing:** This script adds a `'disconnectExpiredUsers'` job to the `Scheduled-Tasks` BullMQ queue for each active tenant.
    4.  **Execution:** `backend/workers/scheduledTaskWorker.js` processes this job. Its logic correctly finds users where `expiryDate` is in the past and `isSuspended` is false.
    5.  **Delegation:** For each expired user, it sets `isSuspended: true` and queues a final `disconnectUser` job for the `mikrotikSyncWorker` to update the router hardware.
*   **Conclusion:** The existing scheduled job architecture is robust for normal operations. However, an investigation has revealed a gap: if the server is down when the disconnection job is scheduled to run, it will be missed, and users will not be disconnected until the next day. To close this gap and make the system more resilient, an additional component is required.

*   **NEW: Add Startup Reconciliation Job:**
    *   **Action:** Create a new script that runs once on server startup to handle any disconnections that were missed during downtime.
    *   **File:** `backend/scripts/startupDisconnect.js`.
    *   **Logic:**
        *   The script will execute immediately when the server starts.
        *   It will find all `MikrotikUser`s whose `expiryDate` is in the past but their `isSuspended` flag is still `false`.
        *   For each user found, it will set `isSuspended: true` and queue a `disconnectUser` job for the `mikrotikSyncWorker`.
    *   **Integration:** The script will be loaded and executed by adding `require('./scripts/startupDisconnect.js');` to the main `backend/server.js` file. This ensures it runs automatically on every application start.

### Phase 4: Deprecation & Cleanup
1.  **Disable Old Billing Jobs:**
    *   **Action:** From the Admin UI, disable the `ScheduledTask` responsible for "Generate Monthly Billing". This will prevent the `generateMonthlyBilling` case in the `scheduledTaskWorker` from running.
2.  **Deprecate Bill/Invoice System:**
    *   **Action:** The `billController` and `invoiceController` are no longer needed for user lifecycle management. They can be removed or repurposed to simply generate receipts for payments made.
    *   **Files:** `backend/controllers/billController.js`, `backend/controllers/invoiceController.js`.
3.  **Remove Old Models (Optional):**
    *   **Action:** The `Bill` and `Invoice` models can eventually be removed after ensuring no other part of the system relies on them for historical reporting. This should be done with caution.

---

## 5. The Reconciliation Safety Net [INVESTIGATION UPDATE]

Our investigation confirmed the existence of a "Reconciliation Engine" (`backend/workers/mikrotikSyncWorker.js`) that runs every 15 minutes.

*   **Function:** It compares the state of users in the database with the state on the Mikrotik routers.
*   **Logic:** It uses the `isSuspended` flag as the single source of truth. If the database says a user is suspended, the reconciliation job will ensure they are disconnected on the router.
*   **Conclusion:** This job is fully compatible with our refactor. It acts as a valuable safety net and does not use any legacy billing logic.

---

## 6. Impact Analysis (Revised)

### Backend
*   **Created Files:**
    *   `backend/services/subscriptionService.js`
    *   `backend/scripts/startupDisconnect.js`
*   **Modified Files:**
    *   `backend/controllers/paymentController.js` (complete overhaul of payment success logic)
    *   `backend/server.js` (to execute the startup script)
    *   `backend/models/Package.js` (to add `durationInDays`)
    *   `backend/controllers/packageController.js` (to support `durationInDays`)
*   **Deprecated/Removed Files:**
    *   `backend/controllers/billController.js`
    *   `backend/controllers/invoiceController.js`
    *   The database entry for the "Generate Monthly Billing" scheduled task.

### Frontend
*   **This is a major impact.** The UI must be updated to reflect the pre-paid model.
*   **Changes Needed:**
    *   The user dashboard should show **"Service expires on [date]"** or **"X Days Remaining"** instead of bill-related information.
    *   Payment sections should be a simple "Buy/Renew Subscription" flow rather than a list of unpaid bills.
    *   All references to "Invoices" and "Bills" in the user-facing context should be removed or changed to "Payment History".
    *   **Standardize Duration Input:** The method for setting subscription durations will be standardized. On pages where a duration is set (e.g., creating/editing packages, creating users), the UI will be updated to use a consistent component: a number input for a value and a dropdown for the unit (Days, Weeks, Months, Years). This replaces inconsistent inputs like manual date pickers or simple text fields.

### Data Migration
*   **A one-time data migration script will be required.**
*   **Action:** This script will need to be run once to transition all existing users.
*   **Logic:** It will iterate through all users who are currently `isSuspended: false`. For each user, it will look at their last paid bill to estimate a fair `expiryDate` and populate the field. For users who are `isSuspended: true`, their `expiryDate` can be set to a date in the past.

---

## 7. Verification Plan

1.  **Payment Flow:**
    *   Verify that a new payment for a suspended user correctly sets their `expiryDate` and reconnects them.
    *   Verify that an early renewal for an active user correctly extends their existing `expiryDate`.
2.  **Expiry Flow:**
    *   Manually set a user's `expiryDate` to a time in the past and trigger the expiry job. Verify the user is suspended in the database and on the router.
3.  **UI:**
    *   Confirm the frontend correctly displays the new expiry date and renewal options.
4.  **Regression:**
    *   Ensure the manual disconnect/reconnect functionality for admins still works as expected.