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
-   [x] `workers/mikrotikSyncWorker.js` (FIXED: Resolved missing import bug and verified functional sync logic)
-   [x] `jobs/reconciliationJob.js`
-   [x] `jobs/scheduleExpiredClientDisconnectsJob.js`

### Phase 7: End-to-End Tests (Upcoming)

-   [ ] **Authentication Flow**
-   [ ] **User Management Flow**
-   [ ] **Mikrotik Management Flow**
-   [ ] **Billing and Payments Flow**
-   [ ] **Support Tickets Flow**
