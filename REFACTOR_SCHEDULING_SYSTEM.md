# Refactor Plan: Event-Driven Scheduling System

## 1. Objective

To replace the current polling-based `masterScheduler` with a resilient, event-driven architecture using BullMQ. This refactor moves the system's "Trigger Logic" from volatile server memory (`node-cron`) to a persistent Redis-backed queue, ensuring that all scheduled actions—whether individual or batched—are durable and parallelizable.

## 2. Current Architecture Analysis

The system currently uses `masterScheduler.js` which relies on `node-cron` to trigger batch scripts at specific times (e.g., a daily 11:59 PM disconnection batch).

### Architectural Status
*   **Intentional Batching:** The current 11:59 PM "End-of-Day" cutoff is a business decision to allow users service until the end of their expiry day. This is a functional feature of the system.
*   **Intermediate Resilience:** While the current reconciler handles some "blip" recovery by checking database flags, the "Trigger" itself remains in-memory.

### Identified Weaknesses (Drivers for Refactor)
*   **The Volatile Trigger (Amnesia):** If the server is offline at the exact moment a cron-job is due (e.g., 11:59:00 PM), the trigger is missed. The system has no built-in way to "remember" that a batch was due unless a human manually runs the script.
*   **Sequential bottlenecks:** Current batch scripts process users one-by-one. In a high-growth environment, this sequential loop becomes a bottleneck that cannot be easily scaled across multiple workers.
*   **Clunky Process Spawning:** The master scheduler must `spawn` child processes for each script. This makes monitoring, error handling, and retrying far more complex than native worker-based tasks.

---

## 3. Proposed Event-Driven Architecture

The new architecture replaces "Memory Alarms" with "Durable Events" in Redis.

### Pattern A: The Lifecycle Event (Precise or Anchored)
This pattern handles events tied to a user's unique timeline.
*   **Default Behavior:** "Exact Time Expiry." Tasks fire at the precise second of the subscription end.
*   **End-of-Day Option:** "Midnight Anchoring." The system calculates the expiry and then "anchors" the delayed job to 11:59:59 PM of that day.
*   **Resilience:** Because the "timer" is in Redis, it survives reboots. If a 11:59 PM job is due while the server is down, it fires the moment the worker re-connects.

### Pattern B: The Parallel Fan-Out
Instead of one heavy script looping through users, we use a "Master/Worker" flow:
1.  **Master Job:** A BullMQ Repeatable job (the trigger) queries the DB once.
2.  **Fan-Out:** It enqueues thousands of individual `syncUser` jobs into the queue.
3.  **Parallel Execution:** Multiple workers process these jobs simultaneously, allowing a 5,000-user batch to be finished in seconds.

---

## 4. Separation of Responsibility (The "Boss" Model)

*   **The Boss (BullMQ Lifecycle Worker):** The only authority allowed to evaluate the `expiryDate`. It handles the **Decision** to flip the `isSuspended` flag and send the SMS. 
*   **The Mechanic (Hardware Reconciler):** A lightweight utility that only mirrors the `isSuspended` flag to the MikroTik. It **never** looks at dates, ensuring there are no race conditions where two processes try to decide if a user is "expired."

---

## 5. Benefits of the Refactor

*   **Persistence:** All schedules (Individual or Batch) are stored in Redis. The system never "forgets" an event due to a server blip.
*   **Configurable Precision:** The ISP can switch between "Exact Time" and "End of Day" expiry simply by changing the anchoring logic in the `SubscriptionService`.
*   **Extreme Scalability:** Parallel processing removes the bottleneck of sequential batch scripts.
*   **Clean Separation:** The hardware sync logic remains simple and "dumb," while the business logic remains centralized in the lifecycle workers.

## 6. Implementation Plan

1.  **Subscription Service:** Centralize all expiry updates to schedule/reschedule BullMQ delayed jobs (the "Clear and Replace" strategy).
2.  **Lifecycle Workers:** Implement workers for `processUserExpiry` and `sendReminder`.
3.  **Light Reconciler:** Simplify `mikrotikSyncWorker` to purely follow the `isSuspended` flag without any internal date-checking logic.
4.  **Decommissioning:** Phase out `masterScheduler.js` and the `ScheduledTask` database collection.
