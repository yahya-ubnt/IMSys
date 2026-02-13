# IMSys Hierarchy & Monitoring Specification

## Project Status (as of Feb 13, 2026)

### Phase 1: Foundational Layer [COMPLETED]
This initial phase focused on building the core architecture and data models required for the intelligent monitoring system.

**Key Achievements:**
- **New Data Architecture**:
    - Created the `Building` model to represent physical locations.
    - Redesigned the `Device` model with `physicalBuildingId` and `serviceArea` to accurately map hardware location vs. its coverage zone.
    - Updated the `MikrotikUser` model to link directly to a `Building`.
- **Intelligent Onboarding UI**:
    - Implemented the "New Device" form allowing admins to configure service areas.
    - Built the "Smart User Wizard" which automatically finds and links the correct network Station based on the client's selected building.
    - Added on-the-fly "New Building" creation from within both workflows.
- **Application Stability**:
    - Resolved numerous critical backend and frontend bugs that caused build failures and runtime crashes. The application is now stable.

---

This document defines the technical architecture for the unified network hierarchy and monitoring system in IMSys.

## 1. The Core Philosophy: "The Sane Tree" [DONE]
IMSys does not view the network as a flat list of IPs. It views it as a hierarchical tree where every device and user has a "Parent." This allows for:
- **Root-Cause Analysis**: Identifying exactly where a failure started. [DONE]
- **Alert Suppression**: Silencing hundreds of client alerts when a main tower or router fails. [DONE]
- **Business Intelligence**: Knowing exactly which customers are affected by a specific hardware failure. [DONE]

---

## 2. Data Model Extensions [DONE]

### A. `Device` Model (The "Pizzeria") [DONE]
- **`physicalBuildingId`**: (ObjectId, ref: 'Building') The building where the hardware is physically installed. [DONE]
- **`serviceArea`**: ([ObjectId], ref: 'Building') An array of Building IDs this device provides service to. This is its "delivery zone." [DONE]
- **`parentId`**: (ObjectId, ref: 'Device') The device's parent in the network hardware tree. [DONE]

### B. `Building` Model (The "Neighborhood") [DONE]
- A simple model containing `name`, `address`, etc. Acts as a geographical grouping for users and devices. [DONE]

### C. `MikrotikUser` Model (The "Customer") [DONE]
- **`buildingId`**: (ObjectId, ref: 'Building') The building where the customer is physically located. [DONE]
- **`stationId`**: (ObjectId, ref: 'Device') A direct link to the specific Device providing the service. This is mandatory for monitoring. [DONE]

---

## 3. Monitoring Strategies

### Tier 1: Core Heartbeat (WireGuard) [DONE]
- **Target**: Core Routers. [DONE]
- **Method**: BullMQ job pings the WireGuard Tunnel IP every 60 seconds. [DONE]
- **Failure**: If the tunnel IP is unreachable, the Router is marked `DOWN`, and all child alerts are suppressed. [DONE]

### Tier 2: Infrastructure "Snitch" (Netwatch) [DONE]
- **Target**: APs, Switches, Sector Antennas. [DONE]
- **Method**: IMSys injects a Netwatch rule into the Core Router. [DONE]
- **Webhook**: `POST /api/webhooks/network-event?id={deviceId}&status={up|down}` [DONE]
- **Benefit**: Zero server polling; instant failure reporting. [DONE]

### Tier 3: Static User Monitoring [REMOVED / MANUAL ONLY]
- **Target**: Users with static IPs (using DHCP Reservations).
- **Status**: 
    - **Background Monitoring**: **REMOVED**. No ICMP polling or Netwatch is performed for static users to minimize server and router load.
    - **Live Check**: "Live Check" button triggers an instant `/ping` from the router for real-time verification. [DONE]

### Tier 4: PPPoE "Event Push" [DONE]
- **Target**: PPPoE Users. [DONE]
- **Method**: Profile scripts (`on-up`/`on-down`) send webhooks to IMSys. [DONE]
- **Benefit**: 100% scalable; zero server load. [DONE]

---

## 4. The Alert Sanity Algorithm (Suppression) [DONE]

When a "DOWN" event is received for `TargetX`:
1.  **Look Up Parent**: Find `parentId` or `linkedDeviceId` for `TargetX`. [DONE]
2.  **Check Parent Status**: 
    *   If `Parent` is `DOWN`: Log the failure for `TargetX` but **SUPPRESS** all notifications (SMS/Email). [DONE]
    *   If `Parent` is `UP`: This is the root cause. **SEND** notifications for `TargetX`. [DONE]
3.  **Recursive Check**: The system continues checking parents all the way to the Core Router to ensure no higher-level failure is active. [DONE]

---

## 5. The Recursive Diagnostic Engine (The "Flashlight") [DONE]

To support Alert Suppression and Smart Diagnostics, the system uses a dedicated service to "walk" the hierarchy upwards in real-time.

### A. The Engine Logic: `verifyRootCause(targetId)` [DONE]
- **Trigger**: Any "DOWN" event from a webhook or poll. [DONE]
- **Recursive Step**: 
    1. IMSys identifies the `parentId` (Infrastructure) or `linkedDeviceId` (User). [DONE]
    2. IMSys executes an instant `/ping` to the parent IP via the Core Router API. [DONE]
    3. If the parent is reachable: The engine stops and identifies the original `targetId` as the root cause. [DONE]
    4. If the parent is unreachable: The engine marks the parent as `DOWN` in the DB and recursively calls `verifyRootCause(parentId)`. [DONE]

### B. Technical Implementation [DONE]
- **Service**: `backend/services/diagnosticTreeService.js` [DONE]
- **Uplink Verification**: Uses `mikrotikUtils.js` to proxy pings through the Core Router. [DONE]
- **Outcome**: Ensures that only one "Root Cause" alert is sent, even if 500 child devices go offline. [DONE]

---

## 6. The Smart Onboarding Workflow [DONE]

This workflow is designed to be simple for the admin, while being powerful enough to handle complex network layouts.

### A. Phase 1: Device Configuration (Setting the "Delivery Zone") [DONE]

This is a one-time setup for each new Station (antenna).
1.  **Physical Location**: Admin adds a new Device and assigns it to its `physicalBuildingId`. [DONE]
2.  **Service Area**: Admin specifies the `serviceArea` for this device. [DONE]

### B. Phase 2: The New Client Wizard (Placing the "Order") [DONE]

This is the simplified workflow for adding a new user.
1.  **Select Client's Building**: The admin selects the building where the client physically lives. [DONE]
2.  **The System Finds the Station**: The system automatically searches for all `Devices` that include the building in their `serviceArea`. [DONE]
3.  **The System Links the Station**: [DONE]

---

## 7. The Safety Net: Reconciliation Engine (Self-Healing) [DONE]

Since webhooks can be missed during network instability, a BullMQ job performs a "Double-Check" every 15-30 minutes:

### A. State Reconciliation (The Reality Check) [DONE]
- **Action**: IMSys pulls the full state (PPP Active, DHCP Leases, Netwatch Status) from all routers. [DONE]
- **Correction**: If the Database status differs from the Hardware reality, the Database is updated to match the Hardware. [DONE]

### B. Configuration Reconciliation (The Healer) [DONE]
- **Action**: IMSys verifies that all required "Snitch" scripts (Netwatch, PPP Profiles) are present and correct on the routers. [DONE]
- **Correction**: Missing or altered scripts are automatically re-injected by IMSys. [DONE]

## 8. Implementation Roadmap

### Phase 1: Data & Onboarding (Completed)
1.  **[DONE] Schema & API Foundation**
2.  **[DONE] Smart Onboarding UI**
3.  **[DONE] Hardware Parent Linking UI**
4.  **[DONE] Manual Live Check UI**

### Phase 2: Automation & Monitoring (Completed)
5.  **[DONE] Webhook Receiver**
6.  **[DONE] Diagnostic Engine**
7.  **[DONE] The Injection Engine**
8.  **[DONE] Active Monitoring Jobs**
9.  **[DONE] The Healer (Self-Healing)**
