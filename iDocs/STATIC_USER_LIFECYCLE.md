# Static User Lifecycle: From Manual to Secure Automation

This document outlines the lifecycle of a "Static User" in the system. It covers the original manual flow, its inherent bugs, and a detailed proposal for a secure, automated provisioning system.

---

## Section 1: The Original (Legacy) Flow & Its Bugs

This section describes how the system was initially designed to work and the critical bugs found in that workflow.

### 1.1. The Intended Manual Flow

1.  **Manual Data Entry (Admin UI):** An admin manually enters the user's **MAC Address** and desired **Static IP Address** into the creation form.
2.  **Backend API and Database:** The data is saved to the `MikrotikUser` collection, and a `syncUser` job is queued.
3.  **Hardware Configuration (Worker):** The `mikrotikSyncWorker` picks up the job and runs commands on the MikroTik router to create a static DHCP Lease (binding IP to MAC) and a Simple Queue (for bandwidth).

### 1.2. Identified Issues in the Legacy Flow

#### Issue 1: Frontend UI Bug (Prevents Creation)

-   **File:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`
-   **Problem:** The input field for `Static IP Address` was incorrectly marked as `readOnly`, making it impossible for the admin to enter the required IP address.
-   **Status:** **FIXED**. The `readOnly` property has been removed.

#### Issue 2: Backend Removal Bug (Leaves Ghost Users)

-   **File:** `backend/workers/mikrotikSyncWorker.js`
-   **Problem:** The worker was missing logic to handle `removeUser` jobs. When a user was deleted from the app, their configuration (lease, queue) was left behind on the router permanently.
-   **Status:** **FIXED**. The worker now has a `removeUser` case that calls a utility function to clean up the router configuration.

---

## Section 2: Proposed Feature - Secure, Automated Provisioning

This new workflow eliminates the need for manual MAC address entry and dramatically improves network security.

### 2.1. Overview

The new model introduces two key concepts:
1.  **Auto-Discovery:** A background process will automatically detect a new user's device and link its MAC address to their pre-registered account.
2.  **Walled Garden Security:** By default, all new devices are blocked from accessing the internet. Access is only granted *after* the Auto-Discovery process successfully validates the device against a user account. This prevents unauthorized users from gaining access by guessing IP addresses.

### 2.2. The New Automated Lifecycle

**Step 1: Pre-registering the User (Admin)**
-   An admin creates a new static user. They enter the **Static IP Address** they wish to assign but leave the **MAC Address field blank**.
-   The user is saved to the database with a new status: `pending_mac_assignment`.

**Step 2: First-Time Device Connection (Customer)**
-   The customer connects their device (e.g., their home router) to the network.
-   The MikroTik DHCP server assigns them a *dynamic* lease for their pre-assigned IP address.
-   At this point, the user has an IP but is blocked from accessing the internet by the "Walled Garden" firewall rule.

**Step 3: Automated MAC Discovery & Activation (New Worker)**
-   A new, periodically running background worker (`macAddressDiscoveryWorker`) executes.
-   It fetches all users in the `pending_mac_assignment` state.
-   It connects to the relevant MikroTik router and gets all active DHCP leases.
-   **The Matchmaking:** The worker compares the list of pending users against the list of leases. When it finds a lease whose IP address matches a pending user's IP address, it performs the following actions:
    1.  Copies the `mac-address` from the lease into the user's record in the database.
    2.  Changes the user's status from `pending_mac_assignment` to `active`.
    3.  Queues a `syncUser` job to finalize the configuration.

**Step 4: Granting Access & Final Configuration (`syncUser` Worker)**
-   The existing `mikrotikSyncWorker` picks up the `syncUser` job for the now-`active` user.
-   It connects to the router and performs an updated set of actions:
    1.  **Makes Lease Static:** It converts the user's DHCP lease from dynamic to static.
    2.  **Creates Simple Queue:** It creates the bandwidth-limiting queue as before.
    3.  **Grants Internet Access:** It adds the user's IP address to a special firewall address list named `ALLOWED_USERS`. This action moves them out of the "Walled Garden" and gives them internet access.

### 2.3. Security Model: The "Walled Garden"

This model is the key to preventing unauthorized access.

-   **Deny by Default:** A firewall rule is configured on the router to drop all forwarding traffic from any source IP address that is *not* in the `ALLOWED_USERS` address list.
-   **How it Defeats Bypassing:** If a technician or savvy user manually configures their device with a guessed IP address, they will still be blocked. Their IP will never be added to the `ALLOWED_USERS` list because they have not been processed by the secure Auto-Discovery and activation workflow.

### 2.4. Automatic Disconnection Based on Expiry Date (Existing & Adapted)

-   **Existing Mechanism:** The `scheduledTaskWorker.js` already contains a `disconnectExpiredUsers` job that runs periodically.
-   **Current Flow:** This job identifies users whose `expiryDate` has passed and `isSuspended` is `false`. It then sets `isSuspended` to `true` and queues a `disconnectUser` job for the `mikrotikSyncWorker`. The `mikrotikSyncWorker` then adds the user's IP to the `BLOCKED_USERS` firewall address list.
-   **Adapted Flow for New Model:** This existing worker will be adapted to work with the new `status` field. When an expired user is found, their `status` will be set to `suspended`. The `mikrotikSyncWorker` (via `syncMikrotikUser`) will then remove the user's IP from the `ALLOWED_USERS` list, effectively disconnecting them.

---

## Section 3: New Implementation Plan

This plan outlines the steps to implement the secure, automated system.

### Phase 1: Implement Secure Auto-Discovery

1.  **Database Schema Update:**
    -   **File:** `backend/models/MikrotikUser.js`
    -   **Change:** Add a `status` field with possible values like `pending_mac_assignment`, `active`, `suspended`. This replaces the simple `isSuspended` boolean.

2.  **MikroTik Router Configuration (Manual, one-time setup):**
    -   Create a new address list: `/ip firewall address-list add list=ALLOWED_USERS comment="Users allowed internet access by IMSys"`
    -   Create a new firewall filter rule: `/ip firewall filter add action=drop chain=forward src-address-list=!ALLOWED_USERS comment="IMSys: Walled Garden - Deny all traffic from non-allowed IPs"`
    -   **Important:** This rule must be placed correctly in the filter chain to be effective.

3.  **Update Backend `syncUser` Logic:**
    -   **File:** `backend/utils/mikrotikUtils.js`
    -   **Change:** Modify the `ensureStaticLeaseAndQueue` function as follows:
        *   **DHCP Lease Management:**
            *   The current logic for creating/updating the DHCP lease is mostly fine.
            *   **Crucial Addition:** If `user.macAddress` is `null` or `undefined`, the DHCP lease should *not* be made static. It should remain dynamic until a MAC address is discovered and assigned. The `ensureStaticLeaseAndQueue` function should only attempt to create/update a *static* DHCP lease if `user.macAddress` is present. If `user.macAddress` is missing, it should ensure no static lease exists for that IP.
        *   **Simple Queue Management:**
            *   The current logic is mostly fine. It will continue to create/update the queue based on `user.username`, `user.ipAddress`, and `user.package.rateLimit`.
            *   The `disabled=no` will remain, as the queue itself is always "active" in terms of defining the rate limit, but access is controlled by the firewall.
        *   **Firewall Address List Management (Complete Rewrite):**
            *   **Remove all existing `BLOCKED_USERS` logic.**
            *   **Implement `ALLOWED_USERS` logic:**
                1.  Fetch current entries in the `ALLOWED_USERS` list for the user's `ipAddress`.
                2.  **If `user.status === 'active'`:**
                    *   If the user's `ipAddress` is *not* currently in `ALLOWED_USERS`, add it: `/ip firewall address-list add list=ALLOWED_USERS address=user.ipAddress comment="IMSys: Active User"`
                3.  **If `user.status === 'suspended'` OR `user.status === 'pending_mac_assignment'`:**
                    *   If the user's `ipAddress` *is* currently in `ALLOWED_USERS`, remove it: `/ip firewall address-list remove .id=entry_id`

4.  **Create New Auto-Discovery Worker:**
    -   **File:** `backend/workers/macAddressDiscoveryWorker.js` (new file)
    -   **Logic:** Implement the "matchmaking" logic described in Step 3 of the new lifecycle. This worker should run on a schedule (e.g., every minute).

5.  **Update Backend Service Logic:**
    -   **File:** `backend/services/userService.js`
    -   **Change:** Modify `createMikrotikUser`. If a static user is created without a MAC address, set their initial status to `pending_mac_assignment`.

6.  **Update Frontend UI:**
    -   **File:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`
    -   **Change:** Make the `macAddress` input field optional. The admin can either provide it for immediate activation or leave it blank to trigger the auto-discovery flow.
