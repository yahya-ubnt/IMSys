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
-   [ ] `services/mpesaService.js` (Not done)
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

-   [ ] `controllers/billController.js`
-   [ ] `controllers/buildingController.js`
-   [ ] `controllers/collectionController.js`
-   [ ] `controllers/dailyTransactionController.js`
-   [ ] `controllers/dashboardController.js`
-   [ ] `controllers/deviceController.js`
-   [ ] `controllers/diagnosticController.js`
-   [ ] `controllers/expenseController.js`
-   [ ] `controllers/expenseTypeController.js`
-   [ ] `controllers/hotspotPlanController.js`
-   [ ] `controllers/hotspotSessionController.js`
-   [ ] `controllers/hotspotStkController.js`
-   [ ] `controllers/hotspotUserController.js`
-   [ ] `controllers/invoiceController.js`
-   [ ] `controllers/leadController.js`
-   [ ] `controllers/mikrotikDashboardController.js`
-   [ ] `controllers/mikrotikRouterController.js`
-   [ ] `controllers/mikrotikUserController.js`
-   [ ] `controllers/notificationController.js`
-   [ ] `controllers/packageController.js`
-   [ ] `controllers/paymentController.js`
-   [ ] `controllers/reportController.js`
-   [ ] `controllers/scheduledTaskController.js`
-   [ ] `controllers/searchController.js`
-   [ ] `controllers/settingsController.js`
-   [ ] `controllers/smsAcknowledgementController.js`
-   [ ] `controllers/smsController.js`
-   [ ] `controllers/smsExpiryScheduleController.js`
-   [ ] `controllers/smsProviderController.js`
-   [ ] `controllers/smsTemplateController.js`
-   [ ] `controllers/superAdminController.js`
-   [ ] `controllers/technicianActivityController.js`
-   [ ] `controllers/tenantController.js`
-   [ ] `controllers/ticketController.js`
-   [ ] `controllers/transactionController.js`
-   [ ] `controllers/uploadController.js`
-   [ ] `controllers/userController.js`
-   [ ] `controllers/voucherController.js`
-   [ ] `controllers/webhookController.js`

### Phase 3: End-to-End Tests

Finally, we will write a few critical E2E tests for the most important user flows. This will involve using a library like `supertest` to make HTTP requests to the running application and assert the responses.

-   [ ] User creation and login
-   [ ] Subscription payment and renewal
-   [ ] Creating and resolving a support ticket

---
This plan provides a clear path forward. We can continue with Phase 1, and once we have good coverage there, we can move on to the next phases.

What do you think of this plan?
