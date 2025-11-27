# Multi-Tenancy Refactor Roadmap

This document outlines the plan to refactor the application to use a dedicated `Tenant` model for multi-tenancy.

## Done So Far

*   [x] Created the `Tenant` model (`backend/models/Tenant.js`).
*   [x] Created the `Tenant` routes (`backend/routes/tenantRoutes.js`).
*   [x] Created the `Tenant` controller (`backend/controllers/tenantController.js`).
*   [x] Updated the `User` model to use the new `Tenant` model (`backend/models/User.js`).
*   [x] `backend/models/ApplicationSettings.js`
*   [x] `backend/models/Bill.js`
*   [x] `backend/models/DailyTransaction.js`
*   [x] `backend/models/Device.js`
*   [x] `backend/models/DiagnosticLog.js`
*   [x] `backend/models/DowntimeLog.js`
*   [x] `backend/models/Expense.js`
*   [x] `backend/models/ExpenseType.js`
*   [x] `backend/models/HotspotPlan.js`
*   [x] `backend/models/HotspotUser.js`
*   [x] `backend/models/Lead.js`
*   [x] `backend/models/MikrotikRouter.js`
*   [x] `backend/models/MikrotikUser.js`
*   [x] `backend/models/MpesaAlert.js`
*   [x] `backend/models/Notification.js`
*   [x] `backend/models/NotificationLog.js`
*   [x] `backend/models/Package.js`
*   [x] `backend/models/ScheduledTask.js`
*   [x] `backend/models/SmsAcknowledgement.js`
*   [x] `backend/models/SmsExpirySchedule.js`
*   [x] `backend/models/SmsLog.js`
*   [x] `backend/models/SmsProvider.js`
*   [x] `backend/models/SmsTemplate.js`
*   [x] `backend/models/StkRequest.js`
*   [x] `backend/models/Subscription.js`
*   [x] `backend/models/TechnicianActivity.js`
*   [x] `backend/models/Ticket.js`
*   [x] `backend/models/Transaction.js`
*   [x] `backend/models/UserDowntimeLog.js`
*   [x] `backend/models/Voucher.js`
*   [x] `backend/models/WalletTransaction.js`
*   [x] `backend/models/WhatsAppLog.js`
*   [x] `backend/models/WhatsAppProvider.js`
*   [x] `backend/models/WhatsAppTemplate.js`
*   [x] `backend/controllers/billController.js`
*   [x] `backend/controllers/collectionController.js`
*   [x] `backend/controllers/dailyTransactionController.js`
*   [x] `backend/controllers/dashboardController.js`
*   [x] `backend/controllers/deviceController.js`
*   [x] `backend/controllers/diagnosticController.js`
*   [x] `backend/controllers/expenseController.js`
*   [x] `backend/controllers/expenseTypeController.js`
*   [x] `backend/controllers/hotspotPlanController.js`
*   [x] `backend/controllers/hotspotStkController.js`
*   [x] `backend/controllers/hotspotUserController.js`
*   [x] `backend/controllers/leadController.js`
*   [x] `backend/controllers/mikrotikRouterController.js`
*   [x] `backend/controllers/mikrotikUserController.js`
*   [x] `backend/controllers/notificationController.js`
*   [x] `backend/controllers/packageController.js`
*   [x] `backend/controllers/paymentController.js`
*   [x] `backend/controllers/reportController.js`
*   [x] `backend/controllers/scheduledTaskController.js`
*   [x] `backend/controllers/searchController.js`
*   [x] `backend/controllers/settingsController.js`
*   [x] `backend/controllers/smsAcknowledgementController.js`
*   [x] `backend/controllers/smsController.js`
*   [x] `backend/controllers/smsExpiryScheduleController.js`
*   [x] `backend/controllers/smsProviderController.js`
*   [x] `backend/controllers/smsTemplateController.js`
*   [x] `backend/controllers/superAdminController.js`
*   [x] `backend/controllers/technicianActivityController.js`
*   [x] `backend/controllers/ticketController.js`
*   [x] `backend/controllers/transactionController.js`
*   [x] `backend/controllers/userController.js`
*   [x] `backend/controllers/voucherController.js`
*   [x] `backend/controllers/whatsappController.js`
*   [x] `backend/controllers/whatsAppProviderController.js`
*   [x] `backend/controllers/whatsAppTemplateController.js`
*   [x] `backend/services/alertingService.js`
*   [x] `backend/services/emailService.js`
*   [x] `backend/services/monitoringService.js`
*   [x] `backend/services/mpesaService.js`
*   [x] `backend/services/routerMonitoringService.js`
*   [x] `backend/services/smsService.js`
*   [x] `backend/services/userMonitoringService.js`
*   [x] `backend/services/whatsappService.js`
*   [x] `backend/scripts/backfillDefaultScheduledTasks.js`
*   [x] `backend/scripts/cleanupOldLogs.js`
*   [x] `backend/scripts/disconnectExpiredClients.js`
*   [x] `backend/scripts/generateBillsFromSubscriptions.js`
*   [x] `backend/scripts/masterScheduler.js`
*   [x] `backend/scripts/seedBillingTask.js`
*   [x] `backend/scripts/seedExpiryNotificationTask.js`
*   [x] `backend/scripts/seedScheduledTasks.js`
*   [x] `backend/scripts/seedSubscriptions.js`
*   [x] `backend/scripts/sendExpiryNotifications.js`
*   [x] `backend/scripts/updateTrafficStats.js`
*   [x] `backend/middlewares/mikrotikDashboardMiddleware.js`
*   [x] `backend/server.js`
*   [x] `backend/seeder.js`
*   [x] `backend/utils/mikrotikUtils.js`
*   [x] `backend/utils/paymentProcessing.js`

## To-Do

All files have been updated.