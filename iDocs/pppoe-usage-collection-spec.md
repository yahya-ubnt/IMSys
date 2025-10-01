# PPPoE User Usage Collection Spec

## 1. Objective

To implement a robust, automated system that collects and accumulates data usage (total upload and download) for all PPPoE users. The system will track usage within the user's current billing cycle (e.g., a 30-day period), providing accurate month-to-date totals.

---

## 2. Implementation Details

### 2.1. Database Schema Changes

The `MikrotikUser` model in the database will be modified to include new fields for storing usage data.

**Model:** `MikrotikUser` (`backend/models/MikrotikUser.js`)

**New Fields:**

1.  **`cycleDataUsage`**
    *   **Type:** `Object`
    *   **Description:** Stores the cumulative data usage for the current billing cycle.
    *   **Properties:**
        *   `upload`: `Number`, defaults to `0`. Total bytes uploaded.
        *   `download`: `Number`, defaults to `0`. Total bytes downloaded.

2.  **`sessionDataUsage`**
    *   **Type:** `Object`
    *   **Description:** An internal field used by the collector to track the last known byte counters from a user's active session. This is essential for accurately calculating usage between polls and handling session reconnections.
    *   **Properties:**
        *   `upload`: `Number`, defaults to `0`. The last recorded upload bytes from the router.
        *   `download`: `Number`, defaults to `0`. The last recorded download bytes from the router.

### 2.2. Background Collector Service

A new background service will be created to perform the data collection.

*   **Script Location:** `backend/scripts/collectPppoeUsage.js`
*   **Execution:** This script will run continuously as a background process, scheduled to execute its logic at a regular, configurable interval (e.g., every 5 minutes).
*   **Logic:**
    1.  The script will query the database to get a list of all active Mikrotik routers.
    2.  It will iterate through each router and establish an API connection.
    3.  Using the `/ppp/active/print` command, it will fetch all currently active PPPoE sessions on the router.
    4.  For each session returned by the router, the script will:
        a. Identify the corresponding user in the database via the session's `name` (username).
        b. Retrieve the session's current upload and download byte counters.
        c. Calculate the new data used since the last check by finding the difference between the current counters and the values stored in the user's `sessionDataUsage`.
        d. This calculation will intelligently handle cases where a user has reconnected, which resets the router's session counters. In such a case, the new usage is simply the new session's counter value.
        e. The calculated new usage will be added to the user's `cycleDataUsage` totals.
        f. The `sessionDataUsage` fields will be updated with the latest counter values from the session.
        g. The updated user document will be saved to the database.

### 2.3. Usage Cycle Reset Mechanism

The usage data will be reset to zero at the beginning of each new billing cycle. This reset will be triggered by a payment/renewal event.

*   **Trigger Location:** The `updateMikrotikUser` function in `backend/controllers/mikrotikUserController.js`.
*   **Logic:**
    1.  When a user's `expiryDate` is updated and extended into the future (indicating a subscription renewal), the system will detect this change.
    2.  Upon detecting a renewal, the `cycleDataUsage` object (`{ upload: 0, download: 0 }`) for that specific user will be reset to zero before the user's updated information is saved.

---

## 3. API and UI Impact

*   **API:** The existing `GET /api/mikrotik/users/:id` endpoint will be updated to include the `cycleDataUsage` object in its response, making the total upload and download data available to the frontend.
*   **UI:** The user details page can be updated to display the `cycleDataUsage.upload` and `cycleDataUsage.download` values, providing a clear view of the total data consumed during the current billing period. The need for a manual "Start Monitoring" button for this feature will be eliminated.
