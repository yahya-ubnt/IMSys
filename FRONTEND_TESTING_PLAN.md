# Frontend Testing Plan

## 1. Introduction
This document outlines the strategy and plan for testing the frontend application. The goal is to ensure the quality, reliability, and maintainability of the user interface and its underlying logic.

## 2. Testing Scope
The frontend testing will cover:
- User Interface (UI) components
- User interactions and workflows
- Data fetching and display
- State management
- Routing
- Responsiveness and accessibility (high-level)

## 3. Testing Strategy

### 3.1 Unit Tests
Focus on individual components, functions, and utilities in isolation.
- **Purpose:** Verify that each part of the application works as expected.
- **Tools:** Jest, React Testing Library

### 3.2 Integration Tests
Verify the interaction between multiple components or modules.
- **Purpose:** Ensure that different parts of the application work correctly together.
- **Tools:** React Testing Library

### 3.3 End-to-End (E2E) Tests
Simulate real user scenarios across the entire application.
- **Purpose:** Validate critical user flows from start to finish.
- **Tools:** Cypress (or Playwright, depending on project needs)

## 4. Tools and Frameworks
- **Test Runner:** Jest
- **Component Testing:** React Testing Library
- **E2E Testing:** Cypress (to be confirmed)
- **Mocking:** Jest's mocking capabilities

## 5. Environment Setup

### 5.1 Installation
To run the tests, you first need to install the project dependencies. From the `frontend` directory, run:
```bash
npm install
```

### 5.2 Running Tests
Tests can be run using the following command in the `frontend` directory:
```bash
npm test
```
This will execute all test files located in the `frontend/__tests__` directory.

### 5.3 Configuration
Test configurations are located in the following files at the root of the `frontend` directory:
- `jest.config.js`: Jest's main configuration file.
- `jest.setup.js`: A file to set up the testing environment for each test (e.g., mocking global objects).
- `babel.config.js`: Babel configuration, necessary for transpiling JavaScript/TypeScript.

## 6. Test File Structure
Following the project's existing conventions, frontend tests will be organized in a `__tests__` directory at the root of the `frontend` folder, mirroring the structure of the `src` directory.

Example:
```
frontend/
├───src/
│   ├───app/
│   │   ├───dashboard/
│   │   │   └───page.tsx
│   │   └───bills/
│   │       └───columns.tsx
│   ├───components/
│   │   └───Button/
│   │       └───Button.tsx
│   ├───hooks/
│   │   └───useAuth.ts
│   └───lib/
│       └───utils.ts
├───__tests__/
│   ├───app/
│   │   ├───dashboard/
│   │   │   └───page.test.tsx
│   │   └───bills/
│   │       └───columns.test.tsx
│   ├───components/
│   │   └───Button/
│   │       └───Button.test.tsx
│   ├───hooks/
│   │   └───useAuth.test.ts
│   └───lib/
│       └───utils.test.ts
```

## 7. Test Standards and Best Practices
- **Descriptive Test Names:** Test names should clearly describe what is being tested.
- **Arrange-Act-Assert (AAA) Pattern:** Structure tests with clear setup, action, and assertion phases.
- **Avoid Implementation Details:** Test the public API of components, not their internal workings.
- **Mock External Dependencies:** Isolate tests by mocking API calls, timers, etc.
- **Code Coverage:** Aim for a reasonable code coverage percentage (e.g., 80%), focusing on critical paths.
- **Regular Maintenance:** Keep tests up-to-date with code changes.

## 8. Test Scope - Detailed Checklist

### 8.1 Pages (`app/**/*.tsx`)
- [ ] `app/admin/scheduled-tasks/page.tsx`
- [ ] `app/bills/[id]/edit/page.tsx`
- [ ] `app/bills/[id]/page.tsx`
- [ ] `app/bills/columns.tsx`
- [ ] `app/bills/company/new/page.tsx`
- [ ] `app/bills/company/page.tsx`
- [ ] `app/bills/personal/new/page.tsx`
- [ ] `app/bills/personal/page.tsx`
- [ ] `app/devices/[id]/columns.tsx`
- [ ] `app/devices/[id]/connected-stations-columns.tsx`
- [ ] `app/devices/[id]/connected-users-columns.tsx`
- [ ] `app/devices/[id]/page.tsx`
- [ ] `app/devices/columns.tsx`
- [ ] `app/devices/edit/[id]/page.tsx`
- [ ] `app/devices/new/page.tsx`
- [ ] `app/devices/page.tsx`
- [ ] `app/expenses/all/columns.tsx`
- [ ] `app/expenses/all/page.tsx`
- [ ] `app/expenses/types/columns.tsx`
- [ ] `app/expenses/types/page.tsx`
- [ ] `app/head.tsx`
- [ ] `app/hotspot/plans/columns.tsx`
- [ ] `app/hotspot/plans/hotspot-plan-form.tsx`
- [ ] `app/hotspot/plans/new/page.tsx`
- [ ] `app/hotspot/plans/page.tsx`
- [ ] `app/hotspot/portal/page.tsx`
- [ ] `app/hotspot/users/columns.tsx`
- [ ] `app/hotspot/users/hotspot-user-form.tsx`
- [ ] `app/hotspot/users/new/page.tsx`
- [ ] `app/hotspot/users/page.tsx`
- [ ] `app/hotspot/vouchers/columns.tsx`
- [ ] `app/hotspot/vouchers/new/page.tsx`
- [ ] `app/hotspot/vouchers/page.tsx`
- [ ] `app/hotspot/vouchers/voucher-form.tsx`
- [ ] `app/invoices/[id]/page.tsx`
- [ ] `app/invoices/components/invoice-columns.tsx`
- [ ] `app/invoices/new/page.tsx`
- [ ] `app/invoices/page.tsx`
- [ ] `app/layout.tsx`
- [ ] `app/leads/[id]/page.tsx`
- [ ] `app/leads/columns.tsx`
- [ ] `app/leads/edit/[id]/page.tsx`
- [ ] `app/leads/new/page.tsx`
- [ ] `app/leads/page.tsx`
- [ ] `app/login/page.tsx`
- [ ] `app/mikrotik/packages/[id]/page.tsx`
- [ ] `app/mikrotik/packages/columns.tsx`
- [ ] `app/mikrotik/packages/layout.tsx`
- [ ] `app/mikrotik/packages/new/page.tsx`
- [ ] `app/mikrotik/packages/package-form.tsx`
- [ ] `app/mikrotik/packages/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/dhcp-leases/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/firewall/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/interfaces/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/layout.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/logs/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/overview/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/pppoe/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/queues/page.tsx`
- [ ] `app/mikrotik/routers/[id]/dashboard/terminal/page.tsx`
- [ ] `app/mikrotik/routers/[id]/layout.tsx`
- [ ] `app/mikrotik/routers/[id]/page.tsx`
- [ ] `app/mikrotik/routers/columns.tsx`
- [ ] `app/mikrotik/routers/dashboard/[id]/page.tsx`
- [ ] `app/mikrotik/routers/new/page.tsx`
- [ ] `app/mikrotik/routers/page.tsx`
- [ ] `app/mikrotik/users/[id]/details/mpesa-columns.tsx`
- [ ] `app/mikrotik/users/[id]/details/page.tsx`
- [ ] `app/mikrotik/users/[id]/details/wallet-columns.tsx`
- [ ] `app/mikrotik/users/[id]/diagnostics/[logId]/page.tsx`
- [ ] `app/mikrotik/users/[id]/page.tsx`
- [ ] `app/mikrotik/users/columns.tsx`
- [ ] `app/mikrotik/users/layout.tsx`
- [ ] `app/mikrotik/users/new/page.tsx`
- [ ] `app/mikrotik/users/page.tsx`
- [ ] `app/notifications/page.tsx`
- [ ] `app/page.tsx`
- [ ] `app/payments/cash-purchase/page.tsx`
- [ ] `app/payments/hotspot-transactions/columns.tsx`
- [ ] `app/payments/hotspot-transactions/page.tsx`
- [ ] `app/payments/page.tsx`
- [ ] `app/payments/stk-push/page.tsx`
- [ ] `app/payments/transactions/columns.tsx`
- [ ] `app/payments/transactions/page.tsx`
- [ ] `app/payments/wallet-transactions/columns.tsx`
- [ ] `app/payments/wallet-transactions/page.tsx`
- [ ] `app/register/page.tsx`
- [ ] `app/reports/delayed-payments/[id]/stats/page.tsx`
- [ ] `app/reports/delayed-payments/columns.tsx`
- [ ] `app/reports/delayed-payments/page.tsx`
- [ ] `app/reports/location/columns.tsx`
- [ ] `app/reports/location/page.tsx`
- [ ] `app/reports/mpesa-alert/columns.tsx`
- [ ] `app/reports/mpesa-alert/page.tsx`
- [ ] `app/reports/mpesa-report/columns.tsx`
- [ ] `app/reports/mpesa-report/page.tsx`
- [ ] `app/reports/page.tsx`
- [ ] `app/settings/email/page.tsx`
- [ ] `app/settings/general/page.tsx`
- [ ] `app/settings/mpesa/page.tsx`
- [ ] `app/settings/page.tsx`
- [ ] `app/settings/sms/page.tsx`
- [ ] `app/settings/whatsapp/page.tsx`
- [ ] `app/sms/acknowledgements/columns.tsx`
- [ ] `app/sms/acknowledgements/page.tsx`
- [ ] `app/sms/acknowledgements/sms-acknowledgement-form.tsx`
- [ ] `app/sms/compose/page.tsx`
- [ ] `app/sms/expiry/columns.tsx`
- [ ] `app/sms/expiry/page.tsx`
- [ ] `app/sms/expiry/sms-expiry-schedule-form.tsx`
- [ ] `app/sms/sent/columns.tsx`
- [ ] `app/sms/sent/page.tsx`
- [ ] `app/sms/templates/columns.tsx`
- [ ] `app/sms/templates/page.tsx`
- [ ] `app/sms/templates/sms-template-form.tsx`
- [ ] `app/stk-push/page.tsx`
- [ ] `app/superadmin/dashboard/page.tsx`
- [ ] `app/superadmin/tenants/columns.tsx`
- [ ] `app/superadmin/tenants/page.tsx`
- [ ] `app/technician-activities/[id]/edit/page.tsx`
- [ ] `app/technician-activities/[id]/page.tsx`
- [ ] `app/technician-activities/columns.tsx`
- [ ] `app/technician-activities/installations/new/page.tsx`
- [ ] `app/technician-activities/installations/page.tsx`
- [ ] `app/technician-activities/support/new/page.tsx`
- [ ] `app/technician-activities/support/page.tsx`
- [ ] `app/tickets/[id]/edit/page.tsx`
- [ ] `app/tickets/[id]/page.tsx`
- [ ] `app/tickets/components/ticket-columns.tsx`
- [ ] `app/tickets/components/ticket-toolbar.tsx`
- [ ] `app/tickets/new/page.tsx`
- [ ] `app/tickets/page.tsx`
- [ ] `app/transactions/[id]/edit/page.tsx`
- [ ] `app/transactions/[id]/page.tsx`
- [ ] `app/transactions/company/page.tsx`
- [ ] `app/transactions/components/transaction-columns.tsx`
- [ ] `app/transactions/components/transaction-list.tsx`
- [ ] `app/transactions/new/company/page.tsx`
- [ ] `app/transactions/new/personal/page.tsx`
- [ ] `app/transactions/page.tsx`
- [ ] `app/transactions/personal/page.tsx`

### 8.2 Components (`components/**/*.tsx`)
- [ ] `components/app-layout-content.tsx`
- [ ] `components/app-sidebar.tsx`
- [ ] `components/auth-provider.tsx`
- [ ] `components/bills-chart.tsx`
- [ ] `components/bills-summary-cards.tsx`
- [ ] `components/DailyCollectionsExpensesChart.tsx`
- [ ] `components/dashboard-stats-cards.tsx`
- [ ] `components/dashboard-stats.tsx`
- [ ] `components/data-table.tsx`
- [ ] `components/date-range-picker.tsx`
- [ ] `components/devices/DeviceForm.tsx`
- [ ] `components/diagnostics/DiagnosticButton.tsx`
- [ ] `components/diagnostics/DiagnosticHistory.tsx`
- [ ] `components/diagnostics/DiagnosticModal.tsx`
- [ ] `components/icons/MikrotikRouterIcon.tsx`
- [ ] `components/layout/AppLayoutContent.tsx`
- [ ] `components/leads-chart.tsx`
- [ ] `components/mikrotik/BillingTab.tsx`
- [ ] `components/mikrotik/CombinedRouterInfoCard.tsx`
- [ ] `components/mikrotik/ConnectDisconnectButtons.tsx`
- [ ] `components/mikrotik/DhcpLeasesTable.tsx`
- [ ] `components/mikrotik/DowntimeLogTable.tsx`
- [ ] `components/mikrotik/FirewallRulesTable.tsx`
- [ ] `components/mikrotik/InterfacesTable.tsx`
- [ ] `components/mikrotik/LogsViewer.tsx`
- [ ] `components/mikrotik/MikrotikDashboardSidebar.tsx`
- [ ] `components/mikrotik/MikrotikOverviewCards.tsx`
- [ ] `components/mikrotik/PppoeActiveTable.tsx`
- [ ] `components/mikrotik/PppoeDashboard.tsx`
- [ ] `components/mikrotik/PppoeOverviewCards.tsx`
- [ ] `components/mikrotik/PppoeSecretForm.tsx`
- [ ] `components/mikrotik/PppoeSecretsTable.tsx`
- [ ] `components/mikrotik/PppoeTabs.tsx`
- [ ] `components/mikrotik/PppoeUserCountCard.tsx`
- [ ] `components/mikrotik/QueueFormModal.tsx`
- [ ] `components/mikrotik/QueuesTable.tsx`
- [ ] `components/mikrotik/ResourceGraphCard.tsx`
- [ ] `components/mikrotik/RouterLogsTable.tsx`
- [ ] `components/mikrotik/SmsTab.tsx`
- [ ] `components/mikrotik/StaticOverviewCards.tsx`
- [ ] `components/mikrotik/StaticUserCountCard.tsx`
- [ ] `components/mikrotik/Terminal.tsx`
- [ ] `components/mikrotik/TrafficMonitorCard.tsx`
- [ ] `components/mikrotik/TrafficMonitorGraph.tsx`
- [ ] `components/mikrotik/WalletTransactionTable.tsx`
- [ ] `components/MikrotikUserTrafficChart.tsx`
- [ ] `components/mobile-header.tsx`
- [ ] `components/mpesa-transactions-table.tsx`
- [ ] `components/notifications/NotificationBell.tsx`
- [ ] `components/notifications/NotificationItem.tsx`
- [ ] `components/overview.tsx`
- [ ] `components/protected-layout.tsx`
- [ ] `components/providers.tsx`
- [ ] `components/settings/sms-provider-form.tsx`
- [ ] `components/settings/sms-provider-list.tsx`
- [ ] `components/sms-acknowledgement-form.tsx`
- [ ] `components/sms-expiry-schedule-form.tsx`
- [ ] `components/sms-template-form.tsx`
- [ ] `components/stk-push-form.tsx`
- [ ] `components/theme-provider.tsx`
- [ ] `components/topbar.tsx`
- [ ] `components/ui/accordion.tsx`
- [ ] `components/ui/alert-dialog.tsx`
- [ ] `components/ui/alert.tsx`
- [ ] `components/ui/avatar.tsx`
- [ ] `components/ui/badge.tsx`
- [ ] `components/ui/button.tsx`
- [ ] `components/ui/calendar.tsx`
- [ ] `components/ui/card.tsx`
- [ ] `components/ui/checkbox.tsx`
- [ ] `components/ui/collapsible.tsx`
- [ ] `components/ui/combo-box.tsx`
- [ ] `components/ui/command.tsx`
- [ ] `components/ui/data-table-pagination.tsx`
- [ ] `components/ui/dialog.tsx`
- [ ] `components/ui/dropdown-menu.tsx`
- [ ] `components/ui/form.tsx`
- [ ] `components/ui/input.tsx`
- [ ] `components/ui/label.tsx`
- [ ] `components/ui/multi-select.tsx`
- [ ] `components/ui/popover.tsx`
- [ ] `components/ui/progress.tsx`
- [ ] `components/ui/radio-group.tsx`
- [ ] `components/ui/select.tsx`
- [ ] `components/ui/separator.tsx`
- [ ] `components/ui/sheet.tsx`
- [ ] `components/ui/sidebar.tsx`
- [ ] `components/ui/simple-data-table-pagination.tsx`
- [ ] `components/ui/skeleton.tsx`
- [ ] `components/ui/StyledTabs.tsx`
- [ ] `components/ui/switch.tsx`
- [ ] `components/ui/table.tsx`
- [ ] `components/ui/tabs.tsx`
- [ ] `components/ui/textarea.tsx`
- [ ] `components/ui/toaster.tsx`
- [ ] `components/ui/tooltip.tsx`
- [ ] `components/ui/use-toast.ts`
- [ ] `components/wallet-transactions-table.tsx`

### 8.3 Hooks (`hooks/**/*.ts`)
- [ ] `hooks/use-debounce.ts`
- [ ] `hooks/use-mobile.ts`
- [ ] `hooks/use-settings.tsx`
- [ ] `hooks/use-toast.ts`
- [ ] `hooks/useTerminalWebSocket.ts`

### 8.4 Utilities (`lib/**/*.ts`)
- [ ] `lib/api.ts`
- [ ] `lib/api/sms.ts`
- [ ] `lib/api/utils.ts`
- [ ] `lib/billService.ts`
- [ ] `lib/caretakerAgentService.ts`
- [ ] `lib/dailyTransactionService.ts`
- [ ] `lib/deviceService.ts`
- [ ] `lib/ispService.ts`
- [ ] `lib/issueTypeService.ts`
- [ ] `lib/leadService.ts`
- [ ] `lib/mikrotikUserService.ts`
- [ ] `lib/mpesaSmsParser.ts`
- [ ] `lib/packageService.ts`
- [ ] `lib/technicianActivityService.ts`
- [ ] `lib/ticketService.ts`
- [ ] `lib/transactionService.ts`
- [ ] `lib/utils.ts`

### 8.5 Contexts (`context/**/*.tsx`)
- [ ] `context/NotificationContext.tsx`

### 8.6 Services (`services/**/*.ts`)
- [ ] `services/hotspotService.ts`
- [ ] `services/settingsService.ts`
- [ ] `services/socketService.js`

### 8.7 Types (`types/**/*.ts`)
- [ ] `types/bill.d.ts`
- [ ] `types/caretaker-agent.d.ts`
- [ ] `types/daily-transaction.ts`
- [ ] `types/diagnostics.ts`
- [ ] `types/expense.d.ts`
- [ ] `types/expenses.ts`
- [ ] `types/hotspot.ts`
- [ ] `types/isp-user.d.ts`
- [ ] `types/lead.d.ts`
- [ ] `types/mikrotik-package.ts`
- [ ] `types/mikrotik.ts`
- [ ] `types/mpesa-alert.ts`
- [ ] `types/mpesa-transaction.ts`
- [ ] `types/notification.ts`
- [ ] `types/package.d.ts`
- [ ] `types/report.ts`
- [ ] `types/sms.ts`
- [ ] `types/technician-activity.d.ts`
- [ ] `types/ticket.d.ts`
- [ ] `types/ticket.ts`
- [ ] `types/transaction.ts`
- [ ] `types/users.ts`
- [ ] `types/voucher.ts`

### 8.8 Root Files
- [ ] `middleware.ts` (Not in `src` but important)