# Architectural Deep Dive: Command-Based vs. State-Based Sync

This document provides a technical comparison between the current "Command-Based" implementation and the proposed **Declarative State-Based Sync** model for IMSys.

## 1. The Core Difference

| Feature | Command-Based (Current) | State-Based (Desired) |
| :--- | :--- | :--- |
| **Logic Type** | **Imperative** ("Do this now") | **Declarative** ("Make it so") |
| **Source of Truth** | Split between DB and Router | **The Database is the Master** |
| **Failure Handling** | Retries might cause "Duplicate" errors | Retries are safe and Idempotent |
| **Drift Correction** | Manual (Admin must spot discrepancies) | Automated (Reconciliation Engine) |
| **Scalability** | High risk of "Sync Zombies" at scale | Self-healing and predictable at scale |

---

## 2. Scenario Comparison: Handling a Router Outage

**Scenario**: You attempt to disconnect 100 users for non-payment, but the Core Router reboots or loses connectivity mid-process.

### Current "Command" Model (Imperative)
1.  **The Trigger**: A script/controller sends 100 individual `disconnectUser` commands.
2.  **The Failure**: User #50 fails due to a network timeout.
3.  **The Retry (The Trap)**: BullMQ attempts a retry using **Exponential Backoff**. If the command actually succeeded on the router but the "OK" response was lost, the retry will fail with an "Already Exists" or "Item not found" error.
4.  **The Desync**: The job eventually dies. The DB says one thing, the Router says another.
5.  **The Fix**: An admin must manually reconcile.

### Desired "State" Model (Declarative)
1.  **The Trigger**: IMSys sets the "Desired State" in the DB (e.g., `isSuspended: true`).
2.  **The Sync**: 100 `syncUser` jobs are added to the queue.
3.  **The Resilience**: Job #50 fails. BullMQ uses **Exponential Backoff**.
4.  **The Alignment (Idempotency)**: When the job retries, it checks the router first. If the state is already correct (Partial Success), it marks the job as `completed` silently. If not, it applies the fix.
5.  **The Result**: 100% of users are eventually aligned with the business logic without "Already Exists" errors.

---

## 3. The "Idempotent Sync" Logic

The new **`syncUser`** job replaces multiple specialized jobs with a single "Alignment" loop:

```javascript
async function syncUser(userId) {
  const desired = await MikrotikUser.findById(userId);
  const current = await MikrotikRouter.getActualState(desired.username);

  if (!current) {
    return await MikrotikRouter.create(desired);
  }

  const diff = calculateDiff(desired, current);
  if (Object.keys(diff).length > 0) {
    await MikrotikRouter.update(desired.username, diff);
  }
  
  await MikrotikUser.updateSyncStatus(userId, 'synced');
}
```

### Benefits of this logic:
- **Safe Retries**: If the job runs twice, the second run sees `diff = 0` and does nothing. No "Already Exists" errors.
- **Self-Healing**: If a technician manually changes a user's package via Winbox, the next sync job will see the discrepancy and "Repair" it to match the DB.
- **Lighter Reconciliation**: The reconciliation loop no longer needs complex branching logic. It simply compares states and, if a discrepancy is found, it offloads the work by pushing a single `syncUser` job to the queue.

---

## 4. Handling Conflicts: Rules vs. Facts

In a state-based system, we must distinguish between **Intent** (what we want) and **Reality** (what is happening).

### A. The "Database is Master" (Business Rules)
For all configuration data (Payments, Packages, Disconnections), the Database is the absolute source of truth.
*   **Logic**: If a technician manually "enables" a user on the router, but the DB says `isSuspended: true`, the next sync cycle will **automatically re-disable** the user.
*   **Purpose**: To prevent unauthorized service changes or "free internet" bypasses at the hardware level.

### B. The "Hardware is Master" (Operational Facts)
For real-time status data (Online/Offline, Signal Strength, Uptime), the Hardware is the absolute source of truth.
*   **Logic**: IMSys "Pulls" this data from the router and updates its internal cache. We cannot "command" a router to be online if its power is out.
*   **Purpose**: To ensure the dashboard reflects the physical reality of the network.

---

## 5. Implementation Touchpoints: The Transition Plan

To reach Stage 3, we will modify the following core areas:

### 1. The Worker (`backend/workers/mikrotikSyncWorker.js`)
- **Current**: Uses a `switch-case` for separate commands (`addUser`, `disconnectUser`, etc.).
- **Change**: Consolidate these into a single **`syncUser`** job. This job will always ask: *"What does the DB want?"* vs *"What does the Router have?"* and only send commands if they don't match (Idempotency).

### 2. The Model (`backend/models/MikrotikUser.js`)
- **Current**: Holds `isSuspended` and `package` fields.
- **Change**: Add a `lastSyncedAt` timestamp. Ensure the `syncStatus` enum (`pending`, `synced`, `error`) is consistently used to track the alignment progress.

### 3. The Controllers (`backend/controllers/mikrotikUserController.js`)
- **Current**: Controllers directly trigger specialized command jobs (e.g., `disconnectUser`).
- **Change**: Controllers will now simply "Update the DB State" (e.g., `isSuspended: true`) and trigger a generic **`syncUser`** job. This decouples the "What" (Business Intent) from the "How" (Hardware Execution).

### 4. Direct Writing Bypasses (`paymentProcessing.js` & `mikrotikUtils.js`)
- **Current**: Functions like `reconnectMikrotikUser` write directly to the router API upon payment, bypassing the BullMQ queue.
- **Change**: These must be refactored to stop direct writing. They will now update the DB status and add a **`syncUser`** job to the queue to ensure all hardware changes are durable and tracked.

### 5. The "Final Boss" (The Reconciliation Engine)
- **Current**: `reconcileMikrotikState` runs every 15 mins and tries to fix discrepancies by triggering *more* specialized command jobs.
- **Change**: The engine will now be much lighter. It simply identifies users who are out of sync and triggers a **`syncUser`** job for each. The worker handles the actual logic.

## 6. The Evolution of Sync: Making it "Bullet-Proof"

To understand the value of this upgrade, we look at the three stages of how IMSys interacts with hardware:

### Stage 1: The "Fragile" Model (Direct Commands)
- **Mechanism**: Controller calls the MikroTik API directly and waits for a response.
- **Problem**: If the router is slow, the UI freezes. If the router is offline, the command is lost, creating a permanent desync.
- **Verdict**: ❌ **UNSAFE**

### Stage 2: The "Queued" Model (Current BullMQ Implementation)
- **Mechanism**: Controller puts a specific command (e.g., `addUser`) into a background queue.
- **Benefit**: The UI is snappy, and BullMQ handles retries if the router is temporarily offline.
- **Problem**: "Idempotency Gap." If a command partially succeeds but the network blips before the "OK" reaches IMSys, the retry will fail with an "Already Exists" error. There is still no automatic correction for human errors made via Winbox/WebFig.
- **Verdict**: 🟡 **FUNCTIONAL (BUT JITTERY)**

### Stage 3: The "Bullet-Proof" Model (Declarative State-Based Sync)
- **Mechanism**: Controller updates the "Desired State" in the DB. The Worker performs a **Check -> Act** loop to align the router.
- **Benefit**: Total reliability. Retries are safe and silent. The **Reconciliation Engine** acts as a self-healing "Final Boss" that restores the business logic even if someone manually tampers with the router.
- **Verdict**: ✅ **ENTERPRISE GRADE**

---

## 7. Conclusion: Why this is the "Superior" Path
By moving to a State-Based model, IMSys transforms from a simple "Remote Control" into a robust "Network Orchestrator." It removes the mental burden from the ISP admin, ensuring that the network health reflects the business reality 100% of the time, regardless of hardware or network failures.
