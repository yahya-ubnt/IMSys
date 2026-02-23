# IMSys Diagnostic Engine & Notification Canvas

This document defines the behavior of the intelligent diagnostic engine and the differentiation between automated "Blast Radius" alerts and manual "Path Diagnostics."

---

## 1. The Two Pillars of Logic

### A. The "Up-Walk" (Root-Cause Identification)
When a failure is detected, the engine walks **UP** the hierarchy tree.
*   **Goal**: Find the highest point of failure.
*   **Method**: `verifyRootCause(targetId)`
*   **Logic**: If Device A is down, check Parent B. If B is down, check Parent C.
*   **Outcome**: Prevents "Alert Storms" by identifying that Parent C is the actual problem.

### B. The "Down-Walk" (Impact / Blast Radius)
Once the Root-Cause is identified, the engine walks **DOWN** the tree.
*   **Goal**: Calculate exactly who and what is affected.
*   **Method**: `getImpactSummary(rootCauseId)`
*   **Logic**: Find all children, grandchildren, and users linked to the root-cause device.
*   **Outcome**: Generates the data for the **Notification Canvas**.

---

## 2. Notification Types: Alert vs. Report

### Type 1: The "Automated Canvas" (Proactive)
*   **Trigger**: Netwatch crash or the **"3-User PPPoE Rule"**.
*   **The 3-User Rule**: If ≥3 PPPoE users on the same Station/Sector disconnect within 120 seconds, the system triggers a diagnostic job.
*   **Content**:
    *   **The Hero**: "CRITICAL: [Root Device Name] is OFFLINE."
    *   **The Impact**: 
        *   **Users**: 42 Total (38 PPPoE, 4 Static).
        *   **Buildings**: ["West Wing", "Block B", "Main Plaza"].
        *   **Infrastructure**: 2 Stations, 1 AP.
    *   **Status**: "Secondary alerts for children have been suppressed."

### Type 2: The "Diagnostic Report" (Reactive)
*   **Trigger**: Admin clicks "Live Check" or "Run Diagnostics" on a specific user/device.
*   **Content**:
    *   **The Path**: A visual breadcrumb of the network hops.
        *   `Core [UP] -> Sector [UP] -> Station [DOWN] -> User [DOWN]`
    *   **Specifics**: Latency, Last Seen, and Signal Strength (if available).
    *   **Action**: "Reboot Station" or "Contact Technician."

---

## 3. Data Scenarios & Triggers

| Event Type | Logic | Threshold | Result |
| :--- | :--- | :--- | :--- |
| **PPPoE Disc.** | User Webhook | 1 User | Log downtime. No alert unless 3 users hit. |
| **"Mass" Disc.** | PPPoE Webhook | **3 Users / 2 Mins** | Trigger Full Diagnostic & Alert Canvas. |
| **Device Crash** | Netwatch Webhook | Instant | Trigger Full Diagnostic & Alert Canvas. |
| **Router Down** | Master Heartbeat | 3 Missed Polls | Mark Router DOWN. Suppress ALL child alerts. |

---

## 4. Technical Implementation Path

### 1. Webhook Controller Update
*   Modify `handleNetworkEvent` to track PPPoE disconnect timestamps per Station.
*   If count reaches 3, push `verifyDeviceStatus` to the `diagnosticQueue`.

### 2. Diagnostic Service Update
*   Add `getImpactSummary(deviceId)` to recursively count children and users.
*   Ensure the "Up-Walk" uses the 3-attempt/2s robustness threshold.

### 3. Alerting Service Update
*   Create a specialized formatter for "Canvas Alerts" that includes the Impact Summary.
*   Integrate with Socket.io to push a "Rich Toast" or "Alert Canvas" to the Dashboard.

---

## 5. Summary: "The Sane Way"
By combining the **Up-Walk** and **Down-Walk**, IMSys transforms from a noisy alarm system into a smart network orchestrator that tells the admin not just *that* something is broken, but *why* it broke and *how much it costs* in terms of service disruption.
