# Backend Testing Plan

This document outlines the plan and checklist for adding comprehensive tests to the backend application. Our goal is to ensure code quality, prevent regressions, and improve maintainability.

## Testing Strategy

We will follow a standard testing pyramid approach:

1.  **Unit Tests:** Focus on individual modules (services, utils) in isolation. These should be fast and cover as many edge cases as possible.
2.  **Integration Tests:** Test the interaction between different modules, primarily focusing on the flow from controllers to services to models.
3.  **End-to-End (E2E) Tests:** Test the entire API by making HTTP requests to the running application.

## Testing Checklist

### Phase 1: Unit Tests (Current Phase)

The goal is to have unit tests for all critical business logic.

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

### Phase 2: Integration Tests

Once we have good unit test coverage, we will move to integration tests for our controllers. This will involve testing the API endpoints without making actual HTTP requests, but by calling the controller functions directly and mocking the request and response objects.

-   [x] `controllers/billController.js`

-   [x] `controllers/buildingController.js`

-   [x] `controllers/collectionController.js`

-   [x] `controllers/dailyTransactionController.js`

-   [x] `controllers/dashboardController.js`

-   [x] `controllers/deviceController.js`

-   [x] `controllers/diagnosticController.js`
-   [x] `controllers/expenseController.js`
-   [x] `controllers/expenseTypeController.js`
-   [x] `controllers/hotspotPlanController.js`
-   [x] `controllers/hotspotSessionController.js`
-   [x] `controllers/hotspotStkController.js`
-   [x] `controllers/hotspotUserController.js`
-   [x] `controllers/invoiceController.js`
-   [x] `controllers/leadController.js`
-   [x] `controllers/mikrotikDashboardController.js`
-   [x] `controllers/mikrotikRouterController.js`
-   [x] `controllers/mikrotikUserController.js`
-   [x] `controllers/notificationController.js`
-   [x] `controllers/packageController.js`
-   [x] `controllers/paymentController.js`
-   [x] `controllers/reportController.js`
-   [x] `controllers/scheduledTaskController.js`
-   [x] `controllers/searchController.js`
-   [x] `controllers/settingsController.js`
-   [x] `controllers/smsAcknowledgementController.js`
-   [x] `controllers/smsController.js`
-   [x] `controllers/smsExpiryScheduleController.js`
-   [x] `controllers/smsProviderController.js`
-   [x] `controllers/smsTemplateController.js`
-   [x] `controllers/superAdminController.js`
-   [x] `controllers/technicianActivityController.js`
-   [x] `controllers/tenantController.js`
-   [x] `controllers/ticketController.js`
-   [x] `controllers/transactionController.js`
-   [x] `controllers/uploadController.js`
-   [x] `controllers/userController.js`
-   [x] `controllers/voucherController.js`
-   [x] `controllers/webhookController.js`

### Phase 3: Model Unit Tests

The goal is to have dedicated unit tests for Mongoose models to ensure data integrity and correct behavior of schema-level logic.

-   [ ] `models/ApplicationSettings.js`
-   [ ] `models/Bill.js`
-   [ ] `models/Building.js`
-   [ ] `models/DailyTransaction.js`
-   [ ] `models/Device.js`
-   [ ] `models/Expense.js`
-   [ ] `models/ExpenseType.js`
-   [ ] `models/HotspotPlan.js`
-   [ ] `models/HotspotSession.js`
-   [ ] `models/HotspotTransaction.js`
-   [ ] `models/Invoice.js`
-   [ ] `models/Lead.js`
-   [ ] `models/MikrotikRouter.js`
-   [ ] `models/MikrotikUser.js`
-   [ ] `models/MpesaAlert.js`
-   [ ] `models/Notification.js`
-   [ ] `models/Package.js`
-   [ ] `models/ScheduledTask.js`
-   [ ] `models/SmsAcknowledgement.js`
-   [ ] `models/SmsExpirySchedule.js`
-   [ ] `models/SmsLog.js`
-   [ ] `models/SmsProvider.js`
-   [ ] `models/SmsTemplate.js`
-   [ ] `models/Tenant.js`
-   [ ] `models/TechnicianActivity.js`
-   [ ] `models/Ticket.js`
-   [ ] `models/Transaction.js`
-   [ ] `models/User.js`
-   [ ] `models/UserDowntimeLog.js`
-   [ ] `models/Voucher.js`
-   [ ] `models/WalletTransaction.js`

### Phase 4: Middleware Unit Tests

The goal is to test custom Express middleware functions in isolation.

-   [ ] `middlewares/errorHandler.js`
-   [ ] `middlewares/mikrotikDashboardMiddleware.js`
-   [ ] `middlewares/protect.js`

### Phase 5: Route Definition Tests (Light Integration)

The goal is to verify that Express routes are correctly defined and map to the intended controller functions.

-   [ ] All routes in `routes/` directory

### Phase 6: Queue/Worker Integration Tests

The goal is to test the interaction between the application and the BullMQ queues/workers.

-   [ ] `queues/diagnosticQueue.js`
-   [ ] `queues/mikrotikSyncQueue.js`
-   [ ] `workers/mikrotikSyncWorker.js`
-   [ ] `jobs/reconciliationJob.js`
-   [ ] `jobs/scheduleExpiredClientDisconnectsJob.js`

### Phase 7: End-to-End Tests

Finally, we will write a few critical E2E tests for the most important user flows. This will involve using a library like `supertest` to make HTTP requests to the running application and assert the responses.

-   [ ] User creation and login
-   [ ] Subscription payment and renewal
-   [ ] Creating and resolving a support ticket

---
This plan provides a clear path forward. We can continue with Phase 1, and once we have good coverage there, we can move on to the next phases.

What do you think of this plan?
