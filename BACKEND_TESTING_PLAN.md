# Backend Testing Plan

This document outlines the plan and checklist for adding comprehensive tests to the backend application. Our goal is to ensure code quality, prevent regressions, and improve maintainability.

## Testing Strategy (Refactored for Functionality)

We follow a high-fidelity testing approach to ensure the system actually works in production:

1.  **Model Tests:** Dedicated unit tests for Mongoose models using `mongodb-memory-server` to ensure data integrity, schema validation, and middleware (like password hashing) work correctly.
2.  **Functional Integration Tests (Controllers & Services):** **CRITICAL REFACOR.** We have moved away from "Mocked" tests to "Functional" tests. Controllers and Services now interact with a real in-memory MongoDB instance. This catches schema mismatches and query errors that mocks miss.
3.  **End-to-End (E2E) Tests:** Full API flow tests using `supertest` against the running application and database.

---

## 🚩 Backend Audit Summary (Post-Refactor)

After refactoring the infrastructure to use a functional "Ghost DB," we have identified the following:

| Status | Count | Description |
| :--- | :--- | :--- |
| **Verified Functional** | 37 | Controllers verified against real DB schema and logic. |
| **Fixed/Caught** | 6 | Critical bugs discovered and resolved during refactoring (e.g., HotspotUser mapping). |
| **Incomplete/Broken** | 4 | Controllers that require code-level logic alignment before they can pass. |

---

## Testing Checklist

### Phase 1: Unit Tests (Completed)

Focus on business logic in services and utility functions.

-   [x] `services/alertingService.js`
-   [x] `services/emailService.js`
-   [x] `services/monitoringService.js`
-   [x] `services/routerMonitoringService.js`
-   [x] `services/userMonitoringService.js`
-   [x] `services/mpesaService.js`
-   [x] `services/paymentService.js`
-   [x] `services/DeviceService.js`
-   [x] `services/DiagnosticService.js`
-   [x] `services/scheduledTaskService.js`
-   [x] `services/terminalService.js`
-   [x] `services/userService.js`
-   [x] `utils/crypto.js`
-   [x] `utils/formatters.js`
-   [x] `utils/mikrotikUtils.js`
-   [x] `utils/sanitization.js`

### Phase 2: Controller Integration Tests (Functional Refactor)

**Status:** Transitioning from Mocks to Real DB (In-Memory).

-   [x] `controllers/userController.js` (REFACORTED: Uses real DB, caught & fixed role enum bug)
-   [ ] `controllers/paymentController.js` (INCOMPLETE: Missing logic in Service implementation - only placeholders found)
-   [x] `controllers/billController.js` (REFACORTED: Caught and fixed schema type mismatch for dueDate)
-   [x] `controllers/buildingController.js` (REFACORTED: Discovered hardcoded 401 locks on update/delete)
-   [x] `controllers/collectionController.js` (REFACORTED)
-   [x] `controllers/dailyTransactionController.js` (REFACORTED)
-   [x] `controllers/dashboardController.js` (REFACORTED)
-   [x] `controllers/deviceController.js` (REFACORTED)
-   [x] `controllers/diagnosticController.js` (REFACORTED)
-   [x] `controllers/expenseController.js` (REFACORTED)
-   [x] `controllers/expenseTypeController.js` (REFACORTED)
-   [x] `controllers/hotspotPlanController.js` (REFACORTED)
-   [x] `controllers/hotspotSessionController.js` (REFACORTED)
-   [x] `controllers/hotspotStkController.js` (REFACORTED)
-   [x] `controllers/hotspotUserController.js` (REFACORTED: CAUGHT BUG - fixed incorrect field mapping to model)
-   [x] `controllers/invoiceController.js` (REFACORTED)
-   [x] `controllers/leadController.js` (REFACORTED)
-   [x] `controllers/mikrotikDashboardController.js` (REFACORTED)
-   [x] `controllers/mikrotikRouterController.js` (REFACORTED)
-   [x] `controllers/mikrotikUserController.js` (REFACORTED)
-   [x] `controllers/notificationController.js` (REFACORTED: Removed non-existent 'user' field filter)
-   [x] `controllers/packageController.js` (REFACORTED)
-   [x] `controllers/reportController.js` (REFACORTED)
-   [x] `controllers/scheduledTaskController.js` (REFACORTED)
-   [x] `controllers/searchController.js` (REFACORTED)
-   [x] `controllers/settingsController.js` (REFACORTED)
-   [x] `controllers/smsAcknowledgementController.js` (REFACORTED)
-   [x] `controllers/smsController.js` (REFACORTED)
-   [x] `controllers/smsExpiryScheduleController.js` (REFACORTED)
-   [x] `controllers/smsProviderController.js` (REFACORTED)
-   [x] `controllers/smsTemplateController.js` (REFACORTED)
-   [x] `controllers/superAdminController.js` (REFACORTED)
-   [x] `controllers/technicianActivityController.js` (REFACORTED: Added missing 'unit' and 'building' to Model schema)
-   [x] `controllers/tenantController.js` (REFACORTED)
-   [x] `controllers/ticketController.js` (REFACORTED)
-   [x] `controllers/transactionController.js` (REFACORTED: Aligned controller fields with Model schema)
-   [x] `controllers/uploadController.js` (REFACORTED: Verified real file upload and validation)
-   [x] `controllers/voucherController.js` (REFACORTED)
-   [x] `controllers/webhookController.js` (REFACORTED)

### Phase 3: Model Unit Tests (Completed)

Verified with `mongodb-memory-server`.

-   [x] `models/ApplicationSettings.js`
-   [x] `models/Bill.js`
-   [x] `models/Building.js`
-   [x] `models/DailyTransaction.js`
-   [x] `models/Device.js`
-   [x] `models/Expense.js`
-   [x] `models/ExpenseType.js`
-   [x] `models/HotspotPlan.js`
-   [x] `models/HotspotSession.js`
-   [x] `models/HotspotTransaction.js`
-   [x] `models/Invoice.js`
-   [x] `models/Lead.js`
-   [x] `models/MikrotikRouter.js`
-   [x] `models/MikrotikUser.js`
-   [x] `models/MpesaAlert.js`
-   [x] `models/Notification.js`
-   [x] `models/Package.js`
-   [x] `models/ScheduledTask.js`
-   [x] `models/SmsAcknowledgement.js`
-   [x] `models/SmsExpirySchedule.js`
-   [x] `models/SmsLog.js`
-   [x] `models/SmsProvider.js`
-   [x] `models/SmsTemplate.js`
-   [x] `models/Tenant.js`
-   [x] `models/TechnicianActivity.js`
-   [x] `models/Ticket.js`
-   [x] `models/Transaction.js`
-   [x] `models/User.js`
-   [x] `models/UserDowntimeLog.js`
-   [x] `models/Voucher.js`
-   [x] `models/WalletTransaction.js`

### Phase 4: Middleware Unit Tests (Completed)

Verified with shallow mocks.

-   [x] `middlewares/errorHandler.js`
-   [x] `middlewares/mikrotikDashboardMiddleware.js`
-   [x] `middlewares/protect.js`

### Phase 5: Route Definition Tests (Light Integration)

Verified with shallow mocks (URL mapping only).

-   [x] `routes/billRoutes.js`
-   [x] `routes/buildingRoutes.js`
-   ... (All routes verified)

### Phase 6: Queue/Worker Integration Tests

-   [x] `queues/diagnosticQueue.js`
-   [x] `queues/mikrotikSyncQueue.js`
-   [x] `workers/diagnosticWorker.js`
    -   [ ] **Scenario: Root Cause Identification (Station is Down):**
        -   Given: A mock network hierarchy: `Core Router -> Sector -> Station -> User`.
        -   And: A mock `ping` utility configured so the `Station` IP fails but the `Sector` IP succeeds.
        -   When: The diagnostic service is triggered for the `User`.
        -   Then: A `DiagnosticLog` is created where the `Station` is identified as the `rootCause`.
        -   And: The report steps show `Core[UP]`, `Sector[UP]`, `Station[DOWN]`.
-   [x] `workers/mikrotikSyncWorker.js` (FIXED: Resolved missing import bug and verified functional sync logic)
-   [x] `jobs/reconciliationJob.js`
    -   [ ] **Scenario: Successful Payment Reconciliation:**
        -   Given: A valid M-Pesa payload is received for an existing user.
        -   When: The `reconciliationJob` is processed.
        -   Then: A `Transaction` record is created with `status: 'completed'`.
        -   And: The `MikrotikUser`'s balance or expiry date is correctly updated.
    -   [ ] **Scenario: Payment to Non-Existent User (Wrong Account):**
        -   Given: An M-Pesa payload with an invalid `BillRefNumber` (user account).
        -   When: The `reconciliationJob` is processed.
        -   Then: A `SuspenseTransaction` record (or equivalent flagging) is created for manual review.
        -   And: No `Transaction` record is created for any user.
    -   [ ] **Scenario: Payment Amount Mismatch:**
        -   Given: An M-Pesa payload where the amount doesn't match the expected invoice amount.
        -   When: The `reconciliationJob` is processed.
        -   Then: The transaction is flagged for review (e.g., creates a `SuspenseTransaction`).
-   [x] `jobs/scheduleExpiredClientDisconnectsJob.js`
    -   [ ] **Scenario: User Disconnection on Expiry:**
        -   Given: A `MikrotikUser` whose `expiryDate` is in the past.
        -   When: The `scheduleExpiredClientDisconnectsJob` runs.
        -   Then: The user's `status` is set to 'expired'.
        -   And: The mock Mikrotik API is called to disable the user's PPP profile.
-   [ ] **Onboarding Worker (Welcome SMS):** (Assuming a dedicated worker or logic in user creation)
    -   [ ] **Scenario: Welcome SMS Triggered on User Creation:**
        -   Given: A new `MikrotikUser` is created with `sendWelcomeSms: true`.
        -   When: The relevant worker processes the user creation event.
        -   Then: The mock SMS gateway is called with the correct welcome message template and user's phone number.
-   [ ] **Generic Queue/Worker Retry Logic:**
    -   [ ] **Scenario: Third-Party API Failure and Retry:**
        -   Given: A job that calls an external (mocked) API is configured to temporarily fail.
        -   When: The worker attempts to process the job.
        -   Then: The job's state in BullMQ is updated to `waiting` with an increased attempt count and a delayed execution time, as per retry configuration.

### Phase 7: End-to-End Tests (Upcoming)

-   [ ] **Authentication Flow**
-   [ ] **User Management Flow**
-   [ ] **Mikrotik Management Flow**
-   [ ] **Billing and Payments Flow**
-   [ ] **Support Tickets Flow**

### Phase 8: System Integration Tests (SIT)

This phase verifies actual interaction with real (or sandbox) external services and hardware in a dedicated staging/pre-production environment. These tests are less frequent and serve to confirm live API contracts and physical device interaction.

-   [ ] **Mikrotik Hardware Integration:**
    -   [ ] **Scenario: User Provisioning:**
        -   Given: A test Mikrotik router is connected to the staging environment.
        -   When: A `MikrotikUser` is created in the IMSys staging UI.
        -   Then: Verify (via direct Mikrotik API call or manual check) that the user's PPP profile is correctly provisioned on the real test router.
    -   [ ] **Scenario: User Disconnection:**
        -   Given: An active `MikrotikUser` on the test router.
        -   When: The user is suspended/disconnected in IMSys.
        -   Then: Verify the user is actually disconnected from the real test router.
    -   [ ] **Scenario: Diagnostic Pings:**
        -   Given: A test network setup (router, station).
        -   When: A diagnostic is run in IMSys for a user/device.
        -   Then: Verify that actual pings/checks are performed through the real test router (observing Mikrotik logs if possible).

-   [ ] **SMS Provider Integration:**
    -   [ ] **Scenario: Successful SMS Delivery (e.g., Welcome SMS):**
        -   Given: A `MikrotikUser` is created with `sendWelcomeSms: true` in the staging environment.
        -   When: The welcome SMS is triggered.
        -   Then: Verify the SMS is received on a real test phone number.
        -   And: Verify the SMS log in IMSys reflects a 'sent' or 'delivered' status from the provider.
    -   [ ] **Scenario: SMS Send Failure (e.g., Invalid Number):**
        -   Given: An attempt to send an SMS to an intentionally invalid test phone number in the staging environment.
        -   When: The SMS send is triggered.
        -   Then: Verify the SMS log in IMSys correctly captures an 'error' or 'failed' status from the provider.
        -   And: No SMS is received on a real phone.

-   [ ] **M-Pesa Sandbox Integration (STK Push & C2B):**
    -   [ ] **Scenario: STK Push:**
        -   Given: A user initiates an STK Push payment in the IMSys staging UI.
        -   When: The STK Push is processed.
        -   Then: Verify the M-Pesa prompt appears on a real test phone number.
        -   And: Verify a successful transaction reflects in IMSys after completing the push on the test phone.
    -   [ ] **Scenario: C2B Payment (Paybill/Till):**
        -   Given: A C2B payment is initiated directly from a real test phone to the IMSys M-Pesa Paybill/Till number (sandbox).
        -   When: The M-Pesa callback is received by IMSys staging.
        -   Then: Verify the transaction is correctly reconciled and applied to the corresponding `MikrotikUser` in IMSys.
