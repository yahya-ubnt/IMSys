# SMS Reconciliation and Retry Mechanism Specification

## 1. Overview

This document outlines the plan to implement a robust reconciliation and retry mechanism for the SMS sending service. The goal is to improve the reliability of SMS delivery by automatically retrying failed messages and providing a manual intervention option for persistent failures.

## 2. Problem Statement

Currently, when an SMS fails to send for reasons such as insufficient provider credit or a temporary network issue, the `SmsLog` is marked as `Failed`, and no further action is taken. This requires manual monitoring and intervention to resend important notifications.

The existing reconciliation job only checks for SMS logs stuck in the `Pending` state, which is a symptom of a worker crash, and it only logs an alert rather than retrying.

## 3. Proposed Solution: Phase 1 (Failed SMS Retries)

We will implement a solution that automatically retries failed SMS messages and allows for manual retries if the automatic attempts are exhausted.

### 3.1. Backend Implementation

#### 3.1.1. `SmsLog` Model Enhancement

To ensure that personalized, template-based SMS messages can be accurately retried, we must store the data required for personalization in the `SmsLog` itself. We will update the `SmsLog` model (`backend/models/SmsLog.js`) with the following fields:

-   **`retryCount`**: A new field to count the number of automatic retry attempts.
    -   Type: `Number`
    -   Default: `0`
-   **`smsStatus` Enum Update**: We will add a new status to the `smsStatus` enum.
    -   New Status: `RequiresManualIntervention`
    -   The enum will be: `['Success', 'Failed', 'Pending', 'RequiresManualIntervention']`
-   **`triggerType`**: Stores the trigger that initiated the SMS (e.g., 'mikrotik_user_created'). This is necessary to find the correct template on retry.
    -   Type: `String`
-   **`templateData`**: Stores the JSON data object that was used for personalizing the SMS message.
    -   Type: `Object`

#### 3.1.2. `smsWorker` Logic Enhancement

The `smsWorker` (`backend/workers/smsWorker.js`) must be updated to save the new `triggerType` and `templateData` fields when it creates an `SmsLog` entry for a template-based SMS (`sendAcknowledgementSms` job type).

#### 3.1.3. `scheduledTaskWorker` Logic Enhancement

The `reconcileSmsStatus` job within the `scheduledTaskWorker` (`backend/workers/scheduledTaskWorker.js`) will be updated to handle the retry logic for `Failed` messages. The cron schedule for this job will be set to `*/5 * * * *` (every 5 minutes) for production.

The new logic will be as follows:

1.  **Find Failed Logs for Retry**: Query the `SmsLog` collection for documents where `smsStatus: 'Failed'` and `retryCount < 5`.
2.  **Queue for Retry**: For each log found, increment its `retryCount` by 1 and add a new job to the `smsQueue`. The job payload will be reconstructed using the `triggerType` and `templateData` stored in the log.
3.  **Find Persistently Failing Logs**: Query the `SmsLog` collection for documents where `smsStatus: 'Failed'` and `retryCount >= 5`.
4.  **Mark for Manual Intervention**: For each log found, update its `smsStatus` to `RequiresManualIntervention` to prevent it from being picked up by the automatic retry process again.

#### 3.1.4. New API Endpoint for Manual Retry

We will create a new API endpoint to allow authorized users (e.g., admins) to manually trigger a retry.

-   **Endpoint**: `POST /api/v1/sms/logs/:id/retry`
-   **Authentication**: This endpoint will be protected and require admin privileges.
-   **Logic**:
    1.  Find the `SmsLog` by its `id`.
    2.  Reset its `retryCount` to `0`.
    3.  Change its `smsStatus` back to `Pending`.
    4.  Add a new job to the `smsQueue` with the original message data, reconstructed from the log.

### 3.2. Frontend Implementation

The manual retry functionality will be integrated into the main "Sent SMS Log" page (`/sms/sent`).

#### 3.2.1. UI for Manual Intervention

The `SentSmsLogPage` component (`frontend/src/app/sms/sent/page.tsx`) and its associated `columns` definition (`frontend/src/app/sms/sent/columns.tsx`) will be updated:

-   The `SmsLog` type definition will be updated to include `retryCount` and the new `RequiresManualIntervention` status.
-   A `handleRetry` function will be added to `SentSmsLogPage` to manage the API call for retrying an SMS.
-   The `columns` function will be modified to include an "Actions" column.
-   Within the "Actions" column, a "Retry" icon/button will be conditionally displayed next to an SMS log entry if its `smsStatus` is `RequiresManualIntervention`.
-   The `statusFilter` in the `DataTableToolbar` will be updated to include `RequiresManualIntervention` as a selectable option.

#### 3.2.2. Manual Retry Action

-   When an admin user clicks the "Retry" icon on the `/sms/sent` page, the frontend will make a `POST` request to the new `/api/v1/sms/logs/:id/retry` endpoint (defined in `frontend/src/lib/api/sms.ts`).
-   Upon a successful API response, the UI will refresh the SMS logs to show the updated status (e.g., `Pending`).

## 4. Future Enhancements: Phase 2 (Pending SMS Reconciliation)

As discussed, the current reconciliation for `Pending` logs is a passive alert. After the implementation and verification of Phase 1, we can explore more advanced strategies for handling stale `Pending` logs. This could include:

-   A "smart retry" for `Pending` jobs with a circuit breaker pattern to avoid repeatedly trying a job that is causing the worker to crash.
-   More detailed alerts that provide more context about the crashed worker.

This phased approach ensures we can deliver the high-value feature of retrying failed SMS messages safely and then build upon it.
