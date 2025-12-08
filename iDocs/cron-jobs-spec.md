# Spec: System Cron Jobs & Scheduled Tasks

## 1. Objective

To document and track all automated, recurring tasks (cron jobs) that are essential for the operation and maintenance of the ISP Management System. This document serves as a central registry for what is automated, its schedule, its purpose, and what is planned for the future.

---

## 2. Implemented Cron Jobs

This section details the cron jobs that are currently active on the production server.

### 2.1. Automated Disconnection of Expired Users

-   **Task:** Disconnects users from the network whose `expiryDate` has passed.
-   **Script:** `/home/mtk/Downloads/ISP MANAGEMENT SYs/backend/scripts/disconnectExpiredClients.js`
-   **Schedule:** `59 23 * * *` (Every day at 11:59 PM)
-   **Purpose:** This is the enforcement part of the billing cycle. It automatically suspends network access for users who have not paid by the end of their due day, eliminating the need for manual disconnections and ensuring that service is only provided to paid-up customers.
-   **Log File:** `/home/mtk/Downloads/ISP MANAGEMENT SYs/backend/logs/disconnections.log`

---

## 3. Implemented In-App Schedules

This section details automated tasks that run continuously as part of the main application process (e.g., using `setInterval`), started in `server.js`.

### 3.1. Network Health Monitoring

-   **Task:** Periodically checks the status of all MikroTik routers to ensure they are online.
-   **Service:** `backend/services/routerMonitoringService.js`
-   **Schedule:** Runs every 5 seconds (triggered by `setInterval` in `server.js`).
-   **Purpose:** To provide near real-time status updates for all routers. The service has a built-in retry mechanism to prevent false alarms and updates the `isOnline` status of each router in the database. This is a critical service for monitoring network uptime.

---

## 4. Recommended Future Cron Jobs

This section outlines suggested cron jobs that would add significant value to the system but have not yet been implemented.

### 4.1. Automated Payment Reminders

-   **Task:** Send SMS reminders to customers whose subscription is expiring soon.
-   **Proposed Script:** `backend/scripts/sendPaymentReminders.js` (This script needs to be created).
-   **Recommended Schedule:** `5 9 * * *` (Every day at 9:05 AM).
-   **Purpose:** To proactively reduce the number of accidental disconnections by reminding customers that their payment is due. This improves customer satisfaction and ensures more consistent cash flow.
-   **Implementation Notes:** This would require creating a new script that:
    1.  Queries for users whose `expiryDate` is in the near future (e.g., in 3 days).
    2.  Uses the existing `smsService` to send a pre-defined message from an SMS template.

### 4.2. Database Log Cleanup

-   **Task:** Archive or delete old log records to maintain database performance.
-   **Proposed Script:** `backend/scripts/cleanupOldLogs.js` (This script needs to be created).
-   **Recommended Schedule:** `5 3 * * 0` (Every Sunday at 3:05 AM).
-   **Purpose:** To prevent the database from becoming bloated with old, non-essential data (e.g., traffic logs, diagnostic logs) that can slow down queries and take up unnecessary disk space.
-   **Implementation Notes:** This script would:
    1.  Define a retention period (e.g., 180 days).
    2.  Connect to the database and run `deleteMany` queries on log collections for records older than the retention period.
