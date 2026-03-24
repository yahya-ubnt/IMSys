# Grace Period Feature Implementation Specification

This document outlines the implementation details for the "Grace Period" feature, targeting Static and PPPoE Mikrotik users. Hotspot users are explicitly excluded from this feature.

## 1. Database Schema Modifications

The `MikrotikUser` model (`backend/models/MikrotikUser.js`) will be updated to include the following new fields:

*   **`gracePeriodEnabled`**:
    *   Type: `Boolean`
    *   Default: `false`
    *   Description: Flag indicating if the user is currently in a grace period.
*   **`expectedPaymentDate`**:
    *   Type: `Date`
    *   Description: The date an administrator manually sets as the expected payment deadline for a user in grace period.
*   **`originalExpiryDate`**:
    *   Type: `Date`
    *   Description: Stores the user's original subscription expiry date *before* they entered the grace period. This is crucial for payment recalculation.
*   **`gracePeriodDaysUsed`**:
    *   Type: `Number`
    *   Default: `0`
    *   Description: Tracks the number of days the user has spent in the grace period. Used for payment recalculation.

**Example `MikrotikUserSchema` snippet (conceptual addition):**

```javascript
const MikrotikUserSchema = mongoose.Schema(
  {
    // ... existing fields ...
    expiryDate: {
      type: Date,
      required: true,
    },
    // ... existing fields ...

    // Grace Period Fields
    gracePeriodEnabled: {
      type: Boolean,
      default: false,
    },
    expectedPaymentDate: {
      type: Date,
    },
    originalExpiryDate: {
      type: Date,
    },
    gracePeriodDaysUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
```

## 2. Backend API Changes

### 2.1. New Endpoint: Grant Grace Period

A new API endpoint will be created to allow administrators to manually grant a grace period to a Mikrotik user.

*   **Method:** `POST`
*   **Path:** `/api/mikrotik-users/:id/grant-grace-period`
*   **Controller:** `backend/controllers/mikrotikUserController.js`
*   **Request Body:**
    ```json
    {
      "expectedPaymentDate": "YYYY-MM-DD" // The date selected by the admin
    }
    ```
*   **Logic (within `mikrotikUserController.js` calling `userService.js`):**
    1.  Validate `userId` and `expectedPaymentDate`.
    2.  Call a new `UserService.grantGracePeriod(userId, expectedPaymentDate, tenantId)` function.
    3.  This function will:
        *   Fetch the `MikrotikUser` by `id`.
        *   Set `gracePeriodEnabled: true`.
        *   Store the current `expiryDate` into `originalExpiryDate`.
        *   Set `expectedPaymentDate` to the provided value.
        *   Reset `gracePeriodDaysUsed` to `0`.
        *   Set `syncStatus: 'pending'` to trigger a Mikrotik sync.
        *   Save the updated `MikrotikUser` document.
        *   Add a `syncUser` job to `mikrotikSyncQueue` to ensure the user remains connected on Mikrotik.

### 2.2. Modification of Existing User Update Endpoint

The `updateMikrotikUser` function in `backend/controllers/mikrotikUserController.js` (which calls `UserService.updateUser`) will need to ensure that grace period fields are handled correctly if they are part of a general user update. However, the primary activation will be via the dedicated `grant-grace-period` endpoint.

### 2.3. Scheduled Task for Grace Period Enforcement

The `disconnectExpiredUsers` case within `backend/workers/scheduledTaskWorker.js` will be modified.

*   **Current Logic:**
    ```javascript
    const cursor = MikrotikUser.find({
      tenant: tenantId,
      expiryDate: { $lte: currentDate },
      status: 'active',
    }).cursor();
    // ... then updates status to 'suspended' and queues 'disconnectUser'
    ```
*   **Modified Logic:**
    1.  **Query:** The query will need to find users who are either:
        *   Expired and not in grace period (`expiryDate <= currentDate` AND `gracePeriodEnabled: false` AND `status: 'active'`).
        *   In grace period and their `expectedPaymentDate` has passed (`gracePeriodEnabled: true` AND `expectedPaymentDate <= currentDate`).
    2.  **Inside `eachAsync` loop:**
        *   For users found by the first condition (expired, not in grace), proceed as usual: set `status: 'suspended'`, `syncStatus: 'pending'`, and queue `disconnectUser` to `mikrotikSyncQueue`.
        *   For users found by the second condition (grace period expired):
            *   Set `status: 'suspended'`, `gracePeriodEnabled: false`, `expectedPaymentDate: null`, `originalExpiryDate: null`, `gracePeriodDaysUsed: 0`, `syncStatus: 'pending'`.
            *   Queue `disconnectUser` to `mikrotikSyncQueue`.

### 2.4. Payment Recalculation Logic

This logic will be integrated into `processSubscriptionPayment` within `backend/utils/paymentProcessing.js`.

*   **Trigger:** Whenever a payment is successfully recorded for a `MikrotikUser`.
*   **Logic:**
    1.  After fetching the `user` and crediting `amountPaid` to `walletBalance`.
    2.  **Check for Grace Period:**
        ```javascript
        if (user.gracePeriodEnabled) {
            const paymentMoment = moment(); // Current time of payment
            const expectedPaymentMoment = moment(user.expectedPaymentDate);
            const originalExpiryMoment = moment(user.originalExpiryDate);

            if (paymentMoment.isSameOrBefore(expectedPaymentMoment, 'day')) {
                // Scenario A: Payment Made During the Grace Period
                // New expiry date starts from originalExpiryDate
                currentExpiryMoment = originalExpiryMoment;
                console.log(`[Payment] User ${user.username} paid during grace period. New base expiry: ${currentExpiryMoment.toISOString()}`);
            } else {
                // Scenario B: Payment Made After the Grace Period (Late Payment)
                // New expiry date starts from now, then subtract grace days
                const graceDaysUsed = expectedPaymentMoment.diff(originalExpiryMoment, 'days');
                user.gracePeriodDaysUsed = graceDaysUsed; // Store for later use if needed, or calculate here
                console.log(`[Payment] User ${user.username} paid after grace period. Grace days used: ${graceDaysUsed}.`);
                // The existing logic of `currentExpiryMoment = now` will apply,
                // and we'll adjust the final expiry after adding package duration.
            }

            // Reset grace period flags
            user.gracePeriodEnabled = false;
            user.expectedPaymentDate = undefined;
            user.originalExpiryDate = undefined;
            user.gracePeriodDaysUsed = 0; // Reset after use
            user.status = 'active'; // Ensure user is active after payment
            user.syncStatus = 'pending'; // Trigger sync to re-enable on Mikrotik
        } else {
            // Existing logic for non-grace period users
            if (currentExpiryMoment.isBefore(now)) {
                currentExpiryMoment = now;
            }
        }
        ```
    3.  **Adjust `currentExpiryMoment` for Scenario B:** After the main payment processing (where `user.package.durationInDays` is added to `currentExpiryMoment`), if `user.gracePeriodDaysUsed` was greater than 0 (from Scenario B), subtract these days from the `currentExpiryMoment`.
        ```javascript
        // After adding package durations to currentExpiryMoment
        if (user.gracePeriodDaysUsed > 0) {
            currentExpiryMoment.subtract(user.gracePeriodDaysUsed, 'days');
            console.log(`[Payment] Adjusted expiry for ${user.username} by subtracting ${user.gracePeriodDaysUsed} grace days.`);
        }
        user.expiryDate = currentExpiryMoment.toDate();
        ```
    4.  Ensure `mikrotikSyncQueue.add('syncUser', ...)` is called if `user.syncStatus` is 'pending'.

## 3. Frontend Changes (frontend/src)

### 3.1. Mikrotik User Edit Form

*   **Location:** Identify the React/Next.js component responsible for editing Mikrotik user details (e.g., `frontend/src/app/dashboard/mikrotik-users/[id]/edit/page.tsx` or similar).
*   **New UI Element:** Add a date picker component (e.g., a calendar input) labeled "Expected Payment Date" or "Grant Grace Period Until".
*   **Conditional Display:** This date picker should only be visible when editing an existing user, not when creating a new one. It should also only be enabled for Static and PPPoE users.
*   **Interaction:** When the admin selects a date and submits the form (or a dedicated "Grant Grace Period" button), the frontend will call the new `POST /api/mikrotik-users/:id/grant-grace-period` endpoint.

### 3.2. Mikrotik User Listing Page

*   **Location:** Identify the component displaying the list of Mikrotik users (e.g., `frontend/src/app/dashboard/mikrotik-users/page.tsx` or a table component within it).
*   **Status Column:** Modify the rendering logic for the user's status.
    *   If `mikrotikUser.gracePeriodEnabled` is `true`, display "Grace Period" with a distinct color (e.g., yellow, orange).
    *   Optionally, display "Remaining Days: X" next to it, calculated from `expectedPaymentDate`.
    *   Maintain existing status displays (e.g., "Active", "Suspended") for other users.

## 4. Mikrotik Integration Considerations

The core changes will be within `backend/utils/mikrotikUtils.js`, specifically in `syncMikrotikUser` and its sub-functions (`ensurePppSecret`, `ensureStaticLeaseAndQueue`).

*   **Modify `ensurePppSecret(client, user)`:**
    *   The `isSuspended` flag should be determined by: `user.status === 'suspended' && !user.gracePeriodEnabled`.
    *   If `user.gracePeriodEnabled` is `true`, then `desiredProfile` should be `user.package.profile` and `desiredDisabled` should be 'no', regardless of `user.status`.
    *   The logic for terminating active sessions should also respect `gracePeriodEnabled`. Only terminate if `user.status === 'suspended'` AND `!user.gracePeriodEnabled`.

*   **Modify `ensureStaticLeaseAndQueue(client, user)`:**
    *   The `isAllowed` flag should be determined by: `user.status === 'active' || user.gracePeriodEnabled`.
    *   If `user.gracePeriodEnabled` is `true`, the user should be added to `ALLOWED_USERS` and not removed, regardless of `user.status`.

*   **`disconnect_ppp_user.js` (if still in use for direct disconnection):** This script will need to be updated to query the database for the `gracePeriodEnabled` and `expectedPaymentDate` fields before issuing a disconnection command to Mikrotik. If the user is in a grace period and `expectedPaymentDate` has not passed, the script should skip disconnection.

This specification provides a comprehensive plan for implementing the Grace Period feature.