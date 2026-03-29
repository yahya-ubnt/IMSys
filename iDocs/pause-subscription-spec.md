# Pause Subscription Feature Specification (Revised)

## 1. Introduction
This document outlines the technical specifications for implementing a "Pause Subscription" feature for Mikrotik users. This feature allows administrators to temporarily suspend a user's internet service while preserving their remaining subscription time. The service will stop immediately upon pausing, and resume from the preserved time upon unpausing. This feature leverages the existing state-based synchronization architecture, primarily through the `mikrotikSyncQueue` and `mikrotikSyncWorker`.

## 2. Requirements

### 2.1. Functional Requirements
- An administrator must be able to pause an active Mikrotik user's subscription.
- When a subscription is paused, the user's internet service (PPPoE or Static IP) must be immediately suspended on the Mikrotik router.
- The remaining subscription time at the moment of pausing must be accurately preserved (frozen).
- When a paused subscription is unpaused, the user's internet service must be restored on the Mikrotik router, and the subscription timer must resume from the preserved remaining time.
- The feature must support both PPPoE and Static IP user types.
- The "Pause Subscription" action should only be available for users whose subscription is currently active (`isPaused: false` and `expiryDate` is in the future).
- The "Unpause Subscription" action should only be available for users whose subscription is currently paused (`isPaused: true`).
- Automated processes (e.g., daily disconnects, expiry notifications) must correctly account for the `isPaused` state, ensuring paused users are not prematurely disconnected or notified of expiry.
- Payment processing for a paused user should extend their preserved subscription time (`prePauseExpiryDate`) rather than directly modifying the active `expiryDate`.

### 2.2. User Interface (UI) Requirements
- **User Table (`/mikrotik/users`):**
    - A "Pause Subscription" action button/menu item should be present in the action column for active users.
    - A "Unpause Subscription" action button/menu item should be present in the action column for paused users.
    - The user's status in the table should clearly indicate if they are "Paused".
- **User Details Page (`/mikrotik/users/[id]/details`):**
    - A "Pause Subscription" button should be prominently displayed for active users.
    - An "Unpause Subscription" button should be prominently displayed for paused users.
    - A confirmation dialog must appear before pausing a subscription, with the message: "Are you sure you want to pause this subscription? Service will stop immediately and remaining time will be preserved."
    - A confirmation dialog must appear before unpausing a subscription, with the message: "Are you sure you want to unpause this subscription? Service will resume and remaining time will continue counting down."
    - The user's status on the details page should clearly indicate if they are "Paused". If paused, the `remainingDaysAtPause` should be displayed.

## 3. Technical Design

### 3.1. Database Schema Changes (Backend)

The `MikrotikUser` model (`backend/models/MikrotikUser.js`) will require the following new fields and one renamed field:

- `isPaused`: `Boolean`, default `false`. Indicates if the user's subscription is currently paused.
- `pauseDate`: `Date`, optional. Stores the timestamp when the subscription was paused.
- `remainingDaysAtPause`: `Number`, optional. Stores the number of remaining days (or milliseconds for higher precision) at the moment the subscription was paused.
- `prePauseExpiryDate`: `Date`, optional. Stores the `expiryDate` that was active *immediately before* the pause. This is crucial for recalculating the new expiry date upon unpausing and for handling payments during a paused state.
- **Renamed Field:** The existing `originalExpiryDate` (used for grace periods) will be renamed to `gracePeriodOriginalExpiryDate` to avoid naming conflicts and improve clarity.

### 3.2. API Endpoints (Backend)

Two new API endpoints will be introduced in `backend/routes/mikrotikUserRoutes.js` and handled by `backend/controllers/mikrotikUserController.js`:

#### 3.2.1. Pause Subscription
- **Endpoint:** `PUT /api/mikrotik/users/:id/pause-subscription`
- **Method:** `PUT`
- **Description:** Pauses a Mikrotik user's subscription.
- **Request Body:** (None)
- **Response:**
    - `200 OK`: `{ message: "Subscription paused successfully." }`
    - `400 Bad Request`: `{ message: "User is already paused or not active." }`
    - `404 Not Found`: `{ message: "User not found." }`
    - `500 Internal Server Error`: `{ message: "Failed to pause subscription." }`
- **Logic (in `UserService.pauseMikrotikUser`):**
    1. Validate that the user exists, is currently active (`isPaused: false`), and has an `expiryDate` in the future.
    2. Calculate `remainingDaysAtPause`: `(user.expiryDate - current_date)` (in milliseconds).
    3. Store the current `user.expiryDate` in `user.prePauseExpiryDate`.
    4. Set `user.isPaused = true`.
    5. Set `user.pauseDate = current_date`.
    6. Set `user.syncStatus = 'pending'` to trigger Mikrotik synchronization.
    7. Save the updated `MikrotikUser` document.
    8. Add a `syncUser` job to `mikrotikSyncQueue` to ensure the user is disconnected on the Mikrotik router.

#### 3.2.2. Unpause Subscription
- **Endpoint:** `PUT /api/mikrotik/users/:id/unpause-subscription`
- **Method:** `PUT`
- **Description:** Unpauses a Mikrotik user's subscription.
- **Request Body:** (None)
- **Response:**
    - `200 OK`: `{ message: "Subscription unpaused successfully." }`
    - `400 Bad Request`: `{ message: "User is not paused." }`
    - `404 Not Found`: `{ message: "User not found." }`
    - `500 Internal Server Error`: `{ message: "Failed to unpause subscription." }`
- **Logic (in `UserService.unpauseMikrotikUser`):**
    1. Validate that the user exists and is currently paused (`isPaused: true`).
    2. Calculate `newExpiryDate`: `current_date + user.remainingDaysAtPause`.
    3. Set `user.isPaused = false`.
    4. Clear `user.pauseDate`, `user.remainingDaysAtPause`, and `user.prePauseExpiryDate`.
    5. Set `user.expiryDate = newExpiryDate`.
    6. Set `user.syncStatus = 'pending'` to trigger Mikrotik synchronization.
    7. Save the updated `MikrotikUser` document.
    8. Add a `syncUser` job to `mikrotikSyncQueue` to ensure the user is re-connected on the Mikrotik router.

### 3.3. Mikrotik Integration Details (via `mikrotikSyncWorker` and `mikrotikUtils.js`)

The actual Mikrotik router interactions will be handled by the `mikrotikSyncWorker` (`backend/workers/mikrotikSyncWorker.js`) processing `syncUser` jobs, which in turn uses functions from `backend/utils/mikrotikUtils.js`.

- **`mikrotikSyncWorker` (`syncUser` job handler):**
    - When processing a `syncUser` job, it will fetch the `MikrotikUser` document.
    - **If `user.isPaused` is `true`:**
        - It will call `mikrotikUtils.removeMikrotikUser(client, user)` to disconnect the user.
        - For PPPoE users: This involves removing their active PPPoE session (`/ppp/active/remove`).
        - For Static IP users: This might involve moving their IP to a blocking address-list or temporarily disabling their IP binding.
    - **If `user.isPaused` is `false`:**
        - It will call `mikrotikUtils.syncMikrotikUser(client, user)` to ensure the user is connected and provisioned according to their `serviceType` and `package`.

### 3.4. Impact on Other Modules

-   **`paymentProcessing.js` (`backend/utils/paymentProcessing.js`):**
    -   When a payment is received for a user who is `isPaused: true`, the logic will be modified to extend the `user.prePauseExpiryDate` by the package duration. The `user.remainingDaysAtPause` will then be recalculated based on the new `prePauseExpiryDate` and `user.pauseDate`. The user will remain `isPaused: true`.
-   **Scheduled Task Workers (`backend/workers/scheduledTaskWorker.js`, `scripts/disconnectExpiredHotspotUsers.js`, `scripts/startupDisconnect.js`):**
    -   All database queries that identify expired users (e.g., `expiryDate: { $lte: currentDate }`) will be updated to include `isPaused: false`. This ensures that users whose subscriptions are intentionally paused are not automatically disconnected.
-   **`DiagnosticService.js` (`backend/services/DiagnosticService.js`):**
    -   The `runDiagnostic` function will be updated to check `mikrotikUser.isPaused`. If `true`, the diagnostic report will indicate that the user is paused, overriding any expiry or network status checks.
-   **SMS Notifications (`backend/services/smsService.js`, `constants/smsTriggers.js`):**
    -   Logic for sending expiry reminder SMS will be updated to exclude users where `isPaused: true`.

### 3.5. Frontend Implementation

#### 3.5.1. User Table (`frontend/src/app/mikrotik/users/columns.tsx`)
-   Modify the `getColumns` function to:
    -   Display "Paused" status prominently if `user.isPaused` is `true`.
    -   Conditionally render a "Pause Subscription" action button for active users (`isPaused: false`, `expiryDate` in future).
    -   Conditionally render an "Unpause Subscription" action button for paused users (`isPaused: true`).
    -   Implement confirmation dialogs as specified in UI Requirements.
    -   Integrate with the new API endpoints for pausing and unpausing.

#### 3.5.2. User Details Page (`frontend/src/app/mikrotik/users/[id]/details/page.tsx`)
-   Fetch the `isPaused`, `pauseDate`, `remainingDaysAtPause`, and `prePauseExpiryDate` fields for the user.
-   Conditionally render a "Pause Subscription" button (for active users) or an "Unpause Subscription" button (for paused users).
-   Implement the confirmation dialogs as specified in UI Requirements.
-   Display the user's status (e.g., "Active", "Paused", "Expired") prominently. If paused, show `remainingDaysAtPause`.
-   Integrate with the new API endpoints for pausing and unpausing.

## 4. Testing Considerations

-   **Unit Tests:** For `UserService.pauseMikrotikUser`, `UserService.unpauseMikrotikUser`, `mikrotikSyncWorker`'s `syncUser` logic, `paymentProcessing.js`'s handling of paused users, and scheduled task queries.
-   **Integration Tests:** For new API endpoints, frontend actions, and end-to-end scenarios (pause, verify Mikrotik disconnection, verify time preservation; unpause, verify Mikrotik re-connection, verify time resumption).
-   **Edge Cases:** Pausing an already paused user, unpausing an active user, payment for a paused user, pausing an expired user (should be prevented), etc.

## 5. Future Considerations

-   Add a "reason for pause" field.
-   Implement an automated "unpause" feature based on a specified date.
-   Logging of pause/unpause events.
-   Notifications to users when their subscription is paused/unpaused.
-   Re-evaluate the `isManuallyDisconnected` field's purpose in light of `isPaused`.