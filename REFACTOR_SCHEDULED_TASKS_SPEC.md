# Spec: Refactoring Scheduled Tasks with a Multi-Queue BullMQ System

## 1. Objective

To completely refactor the legacy `scheduledTask` system by integrating it with a robust, multi-queue BullMQ architecture. This will fix all broken scheduled tasks (disconnections, billing, reminders), eliminate performance risks like "SMS storms," and establish a clear, scalable pattern for all background jobs by separating orchestration from execution.

## 2. Background

The current `scheduledTask` system uses an outdated `node-cron` and `child_process.spawn` approach. This is inefficient and lacks reliability. If a script fails, there is no automatic retry or recovery. The migration to BullMQ has already begun, but the tenant-facing scheduled tasks were left behind, resulting in several broken features.

The following tasks are currently non-functional or high-risk:

*   **Automated Disconnection of Expired Users:** The script is missing and the logic needs to be integrated into a proper worker.
*   **Automated Payment Reminders:** The script is missing. A direct implementation risks "SMS storms" that can block the server and lead to timeouts.
*   **Automated Monthly Billing:** The script is missing.

This refactor will address all these issues by moving their logic into a proper, queue-based system.

## 3. Proposed Solution: The Orchestrator-Executor Model

We will introduce a new **orchestrator** worker (`scheduledTaskWorker`) that handles the "what" and "when" of a scheduled task. This orchestrator will then delegate the actual work to specialized **executor** workers (`mikrotikSyncWorker`, `smsWorker`) by placing jobs on their respective queues.

### 3.1. New & Existing BullMQ Components

1.  **`scheduledTaskQueue` (New Queue):**
    *   **File:** `backend/queues/scheduledTaskQueue.js`
    *   **Name:** `Scheduled-Tasks`
    *   **Purpose:** A lightweight queue that receives high-level jobs directly from the legacy scheduler (via bridge scripts). Jobs include `disconnectExpiredUsers`, `sendPaymentReminders`, etc.

2.  **`scheduledTaskWorker` (New Worker - The Orchestrator):**
    *   **File:** `backend/workers/scheduledTaskWorker.js`
    *   **Purpose:** Processes jobs from the `scheduledTaskQueue`. It contains the business logic to determine *what* needs to be done. It also runs reconciliation jobs.

3.  **`smsQueue` (New Queue):**
    *   **File:** `backend/queues/smsQueue.js`
    *   **Name:** `SMS`
    *   **Purpose:** An executor queue that holds individual `sendSms` jobs. This isolates SMS sending into a single, controlled process.

4.  **`smsWorker` (New Worker - An Executor):**
    *   **File:** `backend/workers/smsWorker.js`
    *   **Purpose:** Processes jobs from the `smsQueue`. It handles the direct interaction with the SMS provider's API, manages retries, and logs the outcome of each message.

5.  **`mikrotikSyncQueue` (Existing Queue):**
    *   **Purpose:** An existing executor queue that handles all hardware interactions.

6.  **`mikrotikSyncWorker` (Existing Worker - An Executor):**
    *   **Purpose:** Processes jobs from the `mikrotikSyncQueue` to perform actions on routers.

### 3.2. Bridge Scripts

To connect the legacy `ScheduledTask` model to our new system, we will use simple bridge scripts.
*   `triggerDisconnectWorker.js`: Adds a `disconnectExpiredUsers` job.
*   `triggerReminderWorker.js`: Adds a `sendPaymentReminders` job.
*   `triggerBillingWorker.js`: Adds a `generateMonthlyBilling` job.

### 3.3. Database Updates

The `scriptPath` in the `ScheduledTask` collection will be updated in `backend/scripts/seedScheduledTasks.js` to point to the new bridge scripts.

### 3.4. Reconciliation & Safety Nets

To ensure system integrity, we will have periodic reconciliation jobs.

1.  **MikroTik Reconciliation (Existing):** The `reconcileMikrotikState` job runs periodically to compare the state of users in the database against the state on the routers, fixing any discrepancies it finds. This is our safety net for hardware state.

2.  **SMS Reconciliation (New):** We will introduce a new `reconcileSmsStatus` job.
    *   **Purpose:** To act as a safety net for the SMS sending process.
    *   **Schedule:** Runs periodically (e.g., every hour).
    *   **Logic:** It scans the `SmsLog` for entries that have been in the `Pending` state for too long (e.g., > 30 minutes). This indicates a worker may have crashed mid-process. For each stale log found, it will **not** resend the SMS (to avoid duplicates) but will instead generate a high-priority system alert for an administrator to investigate.

## 4. Comprehensive Implementation Plan

This is the step-by-step plan to execute the full refactor.

1.  **Create Executor Components (SMS):**
    *   A. Create the `smsQueue` in `backend/queues/smsQueue.js`.
    *   B. Create the `smsWorker` in `backend/workers/smsWorker.js`.

2.  **Create Orchestrator Components:**
    *   A. Create the `scheduledTaskQueue` in `backend/queues/scheduledTaskQueue.js`.
    *   B. Create the `scheduledTaskWorker` in `backend/workers/scheduledTaskWorker.js`.

3.  **Implement Orchestrator Logic:**
    *   A. **`disconnectExpiredUsers` Job:** Add logic to the `scheduledTaskWorker` that finds all expired users for a given tenant and, for each user, adds a `disconnectUser` job to the **`mikrotikSyncQueue`**.
    *   B. **`sendPaymentReminders` Job:** Add logic to the `scheduledTaskWorker` that finds all users due for a reminder and, for each user, adds a `sendSms` job to the **`smsQueue`**.
    *   C. **`generateMonthlyBilling` Job:** Add logic to the `scheduledTaskWorker` to handle the monthly billing process.

4.  **Implement and Schedule Reconciliation:**
    *   A. Add the `reconcileSmsStatus` job logic to the `scheduledTaskWorker`.
    *   B. Create a new scheduler (similar to the existing reconciliation schedulers) to run the `reconcileSmsStatus` job on a recurring basis.

5.  **Create Bridge & Seed Data:**
    *   A. Create the three bridge scripts (`triggerDisconnectWorker.js`, `triggerReminderWorker.js`, `triggerBillingWorker.js`) in `backend/scripts/`.
    *   B. Update the `backend/scripts/seedScheduledTasks.js` file to point the database tasks to these new scripts.

6.  **Final Integration:**
    *   A. Update `backend/server.js` to `require` and start the new workers (`scheduledTaskWorker` and `smsWorker`) and schedulers.

## 5. Benefits

*   **Fixes all broken scheduled tasks.**
*   **Adds a new SMS safety net** to detect processing failures.
*   **Eliminates Performance Bottlenecks:** Prevents "SMS storms."
*   **Improves Reliability:** Automatic retries for both router and SMS provider failures.
*   **Clear Separation of Concerns:** Orchestrators are decoupled from Executors.
*   **Scalability & Maintainability:** The pattern is easily extendable.