# IP Address Management (IPAM) Feature Plan

## 1. Feature Overview

This document outlines the plan to introduce an integrated IP Address Management (IPAM) system directly into our billing application. The primary goal is to automate the assignment of static IP addresses to new customers, eliminating manual IP selection, reducing human error, and ensuring efficient utilization of network resources. This feature will seamlessly integrate with our existing MikroTik hardware provisioning.

## 2. Goals

*   **Automate IP Assignment:** Automatically select and assign the next available static IP address from a predefined pool when creating a new customer.
*   **Prevent IP Conflicts:** Ensure that each assigned IP address is unique and does not conflict with other static assignments or network infrastructure.
*   **Efficient Resource Utilization:** Track IP address usage to prevent waste and provide insights into available capacity.
*   **Reduce Manual Effort & Error:** Minimize the need for administrators to manually track and select IP addresses.
*   **Seamless MikroTik Integration:** Ensure that IP assignments made by the application are correctly provisioned and maintained on the MikroTik routers.
*   **Scalability:** Support management of IP addresses across multiple MikroTik routers and large customer bases.

## 3. High-Level Architecture

The IPAM feature will extend the existing application architecture, primarily impacting the Backend (Database, Services, Workers) and Frontend. The MikroTik routers will continue to be the authoritative source for network state, with our application acting as the policy engine and reservation system.

```
+-------------------+       +-------------------+       +-------------------+
|     Frontend      |       |      Backend      |       |   MikroTik Router |
| (Admin UI)        |       | (API, DB, Workers)|       | (DHCP, Firewall)  |
+-------------------+       +-------------------+       +-------------------+
        ^                           ^     ^                     ^
        |                           |     |                     |
        | (New User Form)           |     | (IP Block Mgmt)     |
        |                           |     |                     |
        +---------------------------+     |                     |
                                          |                     |
                                          | (Find Next IP)      |
                                          |                     |
                                          +---------------------+
                                          |                     |
                                          | (Update DB)         |
                                          |                     |
                                          +---------------------+
                                          |                     |
                                          | (Queue syncUser)    |
                                          |                     |
                                          +---------------------+
                                          |                     |
                                          | (MikroTik API)      |
                                          |                     |
                                          +--------------------->
                                                                |
                                                                | (Static Lease)
                                                                | (Allowed Users)
                                                                v
```

## 4. Detailed Implementation Plan (Phased Approach)

### Phase 1: Core IP Block Management (Backend & DB)

**Goal:** Establish the foundational data model and API for defining and managing IP address blocks.

1.  **New Database Model: `IpBlock`**
    *   **File:** `backend/models/IpBlock.js` (new file)
    *   **Schema:**
        *   `name`: String (e.g., "Main Static Block 1")
        *   `tenant`: ObjectId (ref: 'Tenant', required)
        *   `mikrotikRouter`: ObjectId (ref: 'MikrotikRouter', required) - Links block to a specific router.
        *   `startIp`: String (e.g., "10.10.10.2", required)
        *   `endIp`: String (e.g., "10.10.10.200", required)
        *   `subnetMask`: String (e.g., "/24", optional, for display/validation)
        *   `gateway`: String (optional)
        *   `dnsServers`: [String] (optional)
        *   `isDefault`: Boolean (default: false) - Can be used to auto-select a block.
        *   `status`: Enum ['active', 'inactive'] (default: 'active')
        *   `comment`: String (optional)
    *   **Validation:** Ensure `startIp` < `endIp`, IPs are valid, and blocks don't overlap for the same router.

2.  **API Endpoints for `IpBlock` Management:**
    *   **File:** `backend/routes/ipBlockRoutes.js` (new file)
    *   **File:** `backend/controllers/ipBlockController.js` (new file)
    *   **Endpoints:** CRUD operations for `IpBlock` (Create, Read, Update, Delete).
    *   **Middleware:** Implement authentication and authorization.

3.  **Integration with `MikrotikRouter` Model (Optional but Recommended):**
    *   **File:** `backend/models/MikrotikRouter.js`
    *   **Change:** Add a virtual field or a direct reference to associated `IpBlock`s for easier lookup.

### Phase 2: Automated IP Assignment Logic (Backend)

**Goal:** Implement the core logic for finding and assigning available IP addresses.

1.  **New Service: `IpAssignmentService`**
    *   **File:** `backend/services/ipAssignmentService.js` (new file)
    *   **Function:** `findNextAvailableStaticIp(mikrotikRouterId, tenantId)`
        *   Retrieves `IpBlock`s for the given router and tenant.
        *   Fetches all `MikrotikUser`s associated with that router and tenant that have an `ipAddress` assigned.
        *   Iterates through the IPs in the `IpBlock` range.
        *   Compares against currently assigned IPs to find the first available one.
        *   **Consideration:** Handle cases where no IPs are available.
        *   **Consideration:** Optimize for large blocks (e.g., using bitmasks or efficient database queries).
    *   **Function:** `releaseIpAddress(ipAddress, mikrotikRouterId, tenantId)` (Marks an IP as available again).

2.  **Integrate with `userService.createMikrotikUser`:**
    *   **File:** `backend/services/userService.js`
    *   **Change:** Modify `createMikrotikUser`.
        *   If `userData.ipAddress` is not provided (i.e., admin wants auto-assign):
            *   Call `IpAssignmentService.findNextAvailableStaticIp` to get an IP.
            *   Assign this IP to `newUser.ipAddress`.
            *   If no IP is found, throw an error.

### Phase 3: Frontend Integration (UI)

**Goal:** Provide administrators with the tools to manage IP blocks and utilize auto-assignment.

1.  **Admin UI for IP Block Management:**
    *   **New Page:** `frontend/src/app/mikrotik/ip-blocks/page.tsx`
    *   **Components:** Form for creating/editing IP blocks, table to list blocks.
    *   **Functionality:** Allow admins to define `startIp`, `endIp`, link to a `MikrotikRouter`.

2.  **`MikrotikUserForm` Updates:**
    *   **File:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`
    *   **Change:**
        *   Make the `ipAddress` input field optional.
        *   Add a checkbox or button like "Auto-Assign IP".
        *   If "Auto-Assign IP" is checked, the `ipAddress` input becomes read-only and displays a placeholder like "Auto-assigned on creation".
        *   Ensure the form correctly sends `ipAddress: undefined` or `null` when auto-assign is desired.

### Phase 4: Reconciliation & Cleanup (Backend)

**Goal:** Ensure the IPAM system's view of IP usage remains consistent with the MikroTik and handles IP release.

1.  **IPAM Reconciliation Worker (New or Extend Existing):**
    *   **File:** `backend/workers/ipamReconciliationWorker.js` (new file) or extend `mikrotikSyncWorker.js`.
    *   **Logic:** Periodically (e.g., daily) compare the IPs marked as "in use" in our `IpBlock` tracking against:
        *   `MikrotikUser` records (to ensure all assigned IPs are still valid).
        *   MikroTik static DHCP leases (to catch any discrepancies).
    *   **Action:** Identify and flag discrepancies for admin review or automatically correct them (e.g., mark an IP as available if its user was deleted but the IP wasn't released).

2.  **IP Release on User Deletion:**
    *   **File:** `backend/services/userService.js`
    *   **Change:** Modify `deleteUser`. After a user is successfully deleted from the DB and their configuration removed from MikroTik, call `IpAssignmentService.releaseIpAddress` to mark their IP as available again.

### Phase 5: Reporting & Monitoring (Backend & Frontend)

**Goal:** Provide visibility into IP address utilization.

1.  **Backend API for IP Usage:**
    *   **File:** `backend/controllers/ipBlockController.js`
    *   **Endpoint:** `GET /api/ip-blocks/:id/usage` - Returns a breakdown of used/available IPs within a block.

2.  **Frontend UI for IP Usage:**
    *   **Update IP Block Management Page:** Display usage statistics (e.g., "50/190 IPs used") for each IP block.
    *   **Visualizations:** Potentially a simple bar chart showing utilization.

## 5. Seamless Integration with MikroTik

*   **MikroTik as Source of Truth (Network State):** The MikroTik router remains the ultimate authority on what IPs are actually assigned and active on the network.
*   **Application as Policy Engine:** Our application defines *what should be* on the MikroTik (e.g., "this user should have this IP").
*   **`syncUser` Worker as the Bridge:** The `mikrotikSyncWorker` (via `syncMikrotikUser`) is the critical component that translates our application's desired state into actual MikroTik commands, ensuring consistency.
*   **IPAM Reconciliation:** This worker will ensure that our application's IPAM database accurately reflects the static leases present on the MikroTik, catching any manual changes or errors.

## 6. Considerations & Challenges

*   **IP Uniqueness:** Robust validation to prevent duplicate IP assignments.
*   **Concurrency:** Handling multiple users/workers trying to assign IPs simultaneously.
*   **Error Handling:** Graceful recovery if MikroTik API calls fail during IP assignment/release.
*   **Migration:** How to bring existing static users (and their IPs) under the new IPAM system. This might involve a one-time script to populate `IpBlock` usage.
*   **Subnetting:** Support for different subnet masks within IP blocks.
*   **Performance:** Efficiently querying and updating IP usage for large blocks.

This plan provides a solid roadmap for integrating a powerful IPAM feature, significantly enhancing the automation and reliability of static user provisioning.
