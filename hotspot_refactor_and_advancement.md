# Spec: Hotspot System Refactor and Advancement

## 1. Objective

To perform a comprehensive audit and refactor of the Hotspot user lifecycle. The primary goal is to fix critical bugs, enhance reliability, and establish a foundation for future feature advancements, ensuring the hotspot system is as robust and scalable as the PPPoE service.

## 2. Current State & Identified Issues

An end-to-end audit of the hotspot user flow (from payment to connection) has revealed a critical flaw in the disconnection mechanism.

*   **The Flow:** A user pays via M-Pesa, and upon successful payment, the system grants them internet access by adding their device's MAC address to an IP binding list on the MikroTik router with `type=bypassed`.
*   **The Flaw:** The IP binding command does not include any expiry or duration information. The router is never told when to terminate the session. The only record of expiry is in the IMSys database (`HotspotSession` model).
*   **The Consequence:** This results in users having **permanent, indefinite internet access** after a single payment. The automated disconnection mechanism is completely missing for hotspot users.

## 3. Phase 1: Implementing Automated Disconnection

This phase will fix the critical disconnection bug by implementing a reliable, server-side mechanism to revoke access for expired users. This will mirror the robust orchestrator-executor pattern used for other services.

### 3.1. Implementation Plan

1.  **Create Core Disconnection Utility:**
    *   **File:** `backend/utils/mikrotikUtils.js`
    *   **Action:** Implement and export a new function: `removeHotspotIpBinding(router, macAddress)`.
    *   **Purpose:** This function will contain the logic to connect to a MikroTik router and execute the `/ip/hotspot/ip-binding/remove` command for a specific MAC address.

2.  **Add Executor Job to Sync Worker:**
    *   **File:** `backend/workers/mikrotikSyncWorker.js`
    *   **Action:** Add a new case for a job named `removeHotspotBinding`.
    *   **Purpose:** This job will be responsible for calling the `removeHotspotIpBinding` utility, acting as the "execution" step.

3.  **Implement Orchestrator Logic:**
    *   **File:** `backend/workers/scheduledTaskWorker.js`
    *   **Action:** Add a new case for a job named `disconnectExpiredHotspotUsers`.
    *   **Purpose:** This is the "brains" of the operation. It will run periodically, query the `HotspotSession` database for expired sessions, and for each one, dispatch a `removeHotspotBinding` job to the `mikrotikSyncQueue`. It will also clean up the expired session entry from the database.

4.  **Define and Schedule the Master Job:**
    *   **File:** `backend/scripts/seedScheduledTasks.js`
    *   **Action:** Add a new task definition to the database.
    *   **Purpose:** This will create the master scheduled task that runs on a recurring basis (e.g., every 5 minutes) and triggers the `disconnectExpiredHotspotUsers` orchestration job.

## 4. Phase 2: Future Advancements

This section will track planned improvements to the hotspot system.

*   **[ ] Implement Idempotent Hotspot Sync:** Create a `syncHotspotUser` function similar to `syncMikrotikUser`. This would allow the system to not only add/remove users but also check and repair their state on the router, making the integration more resilient.
*   **[ ] Per-User Bandwidth Limiting:** Enhance the IP binding to include dynamic bandwidth limits based on the user's purchased plan.
*   **[ ] User Self-Service Portal:** Develop a simple status page where a connected hotspot user can see their remaining time and data.
*   **[ ] Graceful Expiry Notifications:** Before a session expires, redirect the user to a page informing them their time is almost up and offering renewal options.
