# BullMQ & Redis Architecture: Robust Background Processing

This document outlines the migration from the current `node-cron` child-process-based scheduler to a robust, Redis-backed queue system using **BullMQ**.

## 1. Why BullMQ?
The current "Master Scheduler" has several architectural risks:
- **Lack of Atomicity**: If a script fails halfway through, there is no way to resume or retry failed items.
- **Resource Heavy**: Spawning child processes is inefficient for high-frequency tasks (like 1-minute hotspot cleanups).
- **State Desync**: Manual updates (e.g., plan changes) are synchronous. If the router is offline, the DB and Router drift apart.

## 2. The New Queue Strategy

### A. The `MikroTik-Sync` Queue (High Priority)
**Purpose:** Handles all interactions with hardware.
- **Jobs:** `syncUser`, `disconnectUser`, `updatePlan`, `rebootRouter`.
- **Why:** If a router is unreachable, BullMQ will use **Exponential Backoff** (retry in 10s, then 1m, then 5m) until the router comes back online. This solves the "Distributed State" problem.
- **Manual Actions:** When an admin changes a plan in the UI, the controller adds a job to this queue instead of calling the MikroTik directly.

### B. The `Billing-Notifications` Queue
**Purpose:** Generates invoices and sends SMS.
- **Jobs:** `generateMonthlyBills`, `sendExpiryReminder`, `sendPaymentAcknowledgement`.
- **Why:** Prevents "SMS storms" from crashing the API and ensures that every billing cycle completes even if the server restarts.

### C. The `Reconciliation` Queue (The "Safety Net")
**Purpose:** An audit job that runs every 15 minutes.
- **Logic:**
  1. Find all users where `syncStatus === 'pending'`.
  2. Add them to the `MikroTik-Sync` queue.
- **Result:** Guaranteed eventual consistency between the Database and Hardware.

## 3. Structural Comparison

| Feature | Current (Child Process) | New (BullMQ) |
| :--- | :--- | :--- |
| **Persistence** | In-Memory (lost on restart) | Redis (survives restarts) |
| **Retries** | Manual / None | Automatic with Backoff |
| **Concurrency** | Limited by CPU | Configurable (e.g., max 5 jobs/router) |
| **Visibility** | Log files only | BullBoard Dashboard (Real-time) |
| **Failure Handling**| Crashes the script | Moves to 'Failed' set for inspection |

## 4. Implementation Steps
1. **Infrastructure**: Add Redis to `docker-compose.yml`.
2. **Worker Setup**: Create `backend/queues/` and `backend/workers/`.
3. **Refactor Scripts**: Convert `disconnectExpiredClients.js` and `monthlyBilling.js` into BullMQ Workers.
4. **Middleware**: Add a `syncStatus` field to `User` and `MikrotikUser` models to track reconciliation.

## 5. Visual Flow
```text
Admin/Cron -> [ Push Job to Redis ] -> [ BullMQ Worker ] -> [ MikroTik API ]
                                            |
                                     (If Fail: Retry Later)
                                            |
                                     (If Success: Mark 'Synced')
```
