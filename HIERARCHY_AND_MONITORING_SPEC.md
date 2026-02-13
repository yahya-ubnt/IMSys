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

## 1. The Core Philosophy: "The Sane Tree"
IMSys does not view the network as a flat list of IPs. It views it as a hierarchical tree where every device and user has a "Parent." This allows for:
- **Root-Cause Analysis**: Identifying exactly where a failure started.
- **Alert Suppression**: Silencing hundreds of client alerts when a main tower or router fails.
- **Business Intelligence**: Knowing exactly which customers are affected by a specific hardware failure.

---

## 2. Data Model Extensions

### A. `Device` Model (The "Pizzeria")
- **`physicalBuildingId`**: (ObjectId, ref: 'Building') The building where the hardware is physically installed.
- **`serviceArea`**: ([ObjectId], ref: 'Building') An array of Building IDs this device provides service to. This is its "delivery zone."
- **`parentId`**: (ObjectId, ref: 'Device') The device's parent in the network hardware tree.

### B. `Building` Model (The "Neighborhood")
- A simple model containing `name`, `address`, etc. Acts as a geographical grouping for users and devices.

### C. `MikrotikUser` Model (The "Customer")
- **`buildingId`**: (ObjectId, ref: 'Building') The building where the customer is physically located.
- **`stationId`**: (ObjectId, ref: 'Device') A direct link to the specific Device providing the service. This is mandatory for monitoring.

---

## 3. Monitoring Strategies

### Tier 1: Core Heartbeat (WireGuard)
- **Target**: Core Routers.
- **Method**: BullMQ job pings the WireGuard Tunnel IP every 60 seconds.
- **Failure**: If the tunnel IP is unreachable, the Router is marked `DOWN`, and all child alerts are suppressed.

### Tier 2: Infrastructure "Snitch" (Netwatch)
- **Target**: APs, Switches, Sector Antennas.
- **Method**: IMSys injects a Netwatch rule into the Core Router.
- **Webhook**: `POST /api/webhooks/network-event?id={deviceId}&status={up|down}`
- **Benefit**: Zero server polling; instant failure reporting.

### Tier 3: Static User "DHCP-Event" Model
- **Target**: Users with static IPs (using DHCP Reservations).
- **Provisioning**: 
    1. **DHCP Reservation**: IMSys locks the `IP` to the `MAC Address` on the Core Router.
    2. **Simple Queue**: Speed is enforced via a Simple Queue based on the `Package`.
- **Status Method**: 
    - **Event-Driven (Online)**: Router uses DHCP Lease Scripts (`on-bound`) for instant "ONLINE" status.
    - **Fast Offline (Targeted ARP Polling)**: Server asks the router for specific static IPs in its ARP table (every 5-10 mins). This is more efficient than dumping the entire ARP table.
    - **Confirmed Offline (Event-Driven)**: Router uses DHCP Lease Scripts (`on-delete`) for final confirmation after lease expiration.
    - **Diagnostic Lever**: "Live Check" button triggers an instant `/ping` from the router.

### Tier 4: PPPoE "Event Push"
- **Target**: PPPoE Users.
- **Method**: Profile scripts (`on-up`/`on-down`) send webhooks to IMSys.
- **Benefit**: 100% scalable; zero server load.

---

## 4. The Alert Sanity Algorithm (Suppression)

When a "DOWN" event is received for `TargetX`:
1.  **Look Up Parent**: Find `parentId` or `linkedDeviceId` for `TargetX`.
2.  **Check Parent Status**: 
    *   If `Parent` is `DOWN`: Log the failure for `TargetX` but **SUPPRESS** all notifications (SMS/Email).
    *   If `Parent` is `UP`: This is the root cause. **SEND** notifications for `TargetX`.
3.  **Recursive Check**: The system continues checking parents all the way to the Core Router to ensure no higher-level failure is active.

---

## 5. The Recursive Diagnostic Engine (The "Flashlight")

To support Alert Suppression and Smart Diagnostics, the system uses a dedicated service to "walk" the hierarchy upwards in real-time.

### A. The Engine Logic: `verifyRootCause(targetId)`
- **Trigger**: Any "DOWN" event from a webhook or poll.
- **Recursive Step**: 
    1. IMSys identifies the `parentId` (Infrastructure) or `linkedDeviceId` (User).
    2. IMSys executes an instant `/ping` to the parent IP via the Core Router API.
    3. If the parent is reachable: The engine stops and identifies the original `targetId` as the root cause.
    4. If the parent is unreachable: The engine marks the parent as `DOWN` in the DB and recursively calls `verifyRootCause(parentId)`.

### B. Technical Implementation
- **Service**: `backend/services/diagnosticTreeService.js`
- **Uplink Verification**: Uses `mikrotikUtils.js` to proxy pings through the Core Router.
- **Outcome**: Ensures that only one "Root Cause" alert is sent, even if 500 child devices go offline.

---

## 6. The Smart Onboarding Workflow

This workflow is designed to be simple for the admin, while being powerful enough to handle complex network layouts.

### A. Phase 1: Device Configuration (Setting the "Delivery Zone")

This is a one-time setup for each new Station (antenna).
1.  **Physical Location**: Admin adds a new Device and assigns it to its `physicalBuildingId` (e.g., "The antenna is on the roof of **Building A**").
2.  **Service Area**: Admin specifies the `serviceArea` for this device. This is a list of all buildings it can serve.
    - *Scenario 1 (Simple)*: The antenna on Building A only serves Building A. The `serviceArea` is `[Building A]`.
    - *Scenario 2 (Wired Neighbor)*: The antenna on Building A serves both Building A and the wired Building B. The `serviceArea` is `[Building A, Building B]`.

### B. Phase 2: The New Client Wizard (Placing the "Order")

This is the simplified workflow for adding a new user.
1.  **Select Client's Building**: The admin selects the building where the client physically lives (e.g., **Building B**).
2.  **The System Finds the Station**: The system automatically searches for all `Devices` that include "Building B" in their `serviceArea`.
3.  **The System Links the Station**:
    - **If ONE station is found**: It is **auto-selected** and the admin doesn't have to do anything. The form might show a simple confirmation text like `Connected via: Antenna on Building A`.
    - **If MULTIPLE stations are found**: The admin is presented with a small, filtered dropdown list to choose the correct station. This handles the "two antennas in one building" scenario.

This hybrid approach ensures the `User -> Station` link is always correctly established for monitoring, while keeping the UI as simple as possible for the administrator.

## 7. The Safety Net: Reconciliation Engine (Self-Healing)

Since webhooks can be missed during network instability, a BullMQ job performs a "Double-Check" every 15-30 minutes:

### A. State Reconciliation (The Reality Check)
- **Action**: IMSys pulls the full state (PPP Active, DHCP Leases, Netwatch Status) from all routers.
- **Correction**: If the Database status differs from the Hardware reality, the Database is updated to match the Hardware.

### B. Configuration Reconciliation (The Healer)
- **Action**: IMSys verifies that all required "Snitch" scripts (Netwatch, PPP Profiles, DHCP Lease Scripts) are present and correct on the routers.
- **Correction**: Missing or altered scripts are automatically re-injected by IMSys.

## 8. Implementation Roadmap

### Phase 1: Data & Onboarding (Completed)
1.  **[DONE] Schema & API Foundation**: Models and APIs for Buildings, Devices, and Users.
2.  **[DONE] Smart Onboarding UI**: Forms for adding devices and users with the new hierarchy logic.
3.  **[DONE] Hardware Parent Linking UI**: Dropdown to link devices to parents.
4.  **[DONE] Manual Live Check UI**: Button on Device page for instant ping tests.

### Phase 2: Automation & Monitoring (In Progress)
5.  **[DONE] Webhook Receiver**: The `/api/webhooks/network-event` endpoint is ready to receive DOWN events.
6.  **[DONE] Diagnostic Engine**: The `diagnosticTreeService` and its BullMQ worker are built to process DOWN events and find the root cause.
7.  **[TODO] The Injection Engine**: A service that logs into routers to automatically configure the Netwatch, DHCP, and PPPoE scripts that *send* events to the webhook.
8.  **[TODO] Active Monitoring Jobs**: The scheduled, repeating jobs for the "Core Heartbeat" and "Targeted ARP Polling" described in the Monitoring Strategies.
