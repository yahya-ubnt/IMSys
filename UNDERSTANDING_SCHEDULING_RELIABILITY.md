# Understanding Scheduling Reliability: Polling vs. Event-Driven

This document clarifies how the system handles service expiry and hardware synchronization, distinguishing between the "Business Engine" (BullMQ) and the "State Mirror" (Reconciliation).

---

## 1. The Clean Separation of Concerns

To build a high-performance system, we separate the **Decision** (Precalculation) from the **Sync** (Execution).

### Layer 1: The Business Engine (The Decision Maker)
*   **Pattern:** BullMQ Lifecycle (Persistent Delayed Jobs).
*   **The Job:** To evaluate the `expiryDate` rule and set the `isSuspended` flag.
*   **Efficiency:** It calculates the "moment of truth" **once** (when the subscription starts) and schedules an alarm in Redis. 
*   **Persistence:** If the server is down during expiry, Redis ensures the worker flips the flag the second the system reboots.

### Layer 2: The Reconciliation Worker (The State Mirror)
*   **Pattern:** Periodic State Sync.
*   **The Job:** To ensure the **Hardware** matches the **Flag** (`isSuspended`) in the Database.
*   **The Logic:** It is a **"Result Reader."** It does not evaluate business rules or perform date-range queries. It trusts the flag as the stored result of the Business Engine's decision.
*   **The Benefit:** By only reading a binary flag, the Reconciler stays extremely lightweight and avoids **Race Conditions** with the Decision Maker.

---

## 2. The "Blip" Scenario (Server down at 11:59 PM, up at 12:05 AM)

| Step | Actor | Action | Result |
| :--- | :--- | :--- | :--- |
| **1** | **Server** | Server is DOWN at 11:59 PM. | Trigger is preserved in Redis. |
| **2** | **BullMQ** | Server reboots. BullMQ fires the missed job. | The **Flag** is flipped to `true`. |
| **3** | **Reconciler** | Wakes up for its periodic sync. | Sees `isSuspended: true` in DB. |
| **4** | **Hardware** | Reconciler mirrors the flag to Router. | User is disconnected. |

---

## 3. Why this is the "Professional" Architecture

### A. Moving from Evaluation to Execution
In the old system, the Reconciler was "Blind" because it only followed the flag, and the flag-setter (Cron) was unreliable. By making the flag-setter **persistent (BullMQ)**, we can keep the Reconciler "Dumb" without sacrificing reliability.

### B. Single Source of Truth
The `isSuspended` flag becomes the absolute "Command." The Business Engine owns the logic of *when* to set it, and the Reconciler owns the logic of *how* to enforce it on the wire. This eliminates the "Two Bosses" problem where multiple workers fight over date calculations.

### C. Resource Optimization
Range-based date queries (`expiryDate < now`) are more expensive for a database to index and search than a simple binary status flag (`isSuspended: true`). By using the flag, the Reconciler uses the most efficient path possible to identify users who need hardware updates.

---

## 4. Summary: Stored Results vs. Continuous Checking

The **Lifecycle Pattern (BullMQ)** is our "Precalculation Engine." It converts a **Time-Based Rule** into a **Stored Result**.

The **Reconciliation Worker** is our "Enforcement Engine." It mirrors that stored result onto the hardware with maximum speed and minimum noise.
