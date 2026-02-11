# IMSys Hierarchy & Monitoring Specification

This document defines the technical architecture for the unified network hierarchy and monitoring system in IMSys.

## 1. The Core Philosophy: "The Sane Tree"
IMSys does not view the network as a flat list of IPs. It views it as a hierarchical tree where every device and user has a "Parent." This allows for:
- **Root-Cause Analysis**: Identifying exactly where a failure started.
- **Alert Suppression**: Silencing hundreds of client alerts when a main tower or router fails.
- **Business Intelligence**: Knowing exactly which customers are affected by a specific hardware failure.

---

## 2. Data Model Extensions

### A. `Device` Model (Infrastructure)
Used for Routers, Switches, Access Points, and Stations.
- `parentId`: (ObjectId) Reference to another `Device` or `MikrotikRouter`.
- `monitoringMode`: `['SNITCH', 'NONE']`
    - `SNITCH`: Router uses Netwatch to report status via Webhook. (Recommended for APs/Stations).
    - `NONE`: No background polling. (Manual "Live Check" only).
- `status`: `['UP', 'DOWN', 'MAINTENANCE']`

### B. `MikrotikUser` Model (Customers)
- `linkedDeviceId`: (ObjectId) Reference to the `Device` (Station/Antenna) that provides service to this user.
- **Dashboard Status**: 
    - PPPoE: Updated via Webhooks (Instant).
    - Static: Updated via ARP Table polling (Every 5-10 mins).
- **Live Diagnostic**: A manual "Live Check" button for both types to trigger an instant Proxy-Ping for troubleshooting.

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
    - **Event-Driven**: Router uses DHCP Lease Scripts to hit the IMSys Webhook on connection/disconnection.
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

## 6. The Device Onboarding Flow (The "Claim & Context" Workflow)

To maintain a clean hierarchy, devices are added using a guided process that ensures human context is captured.

### Step 1: Identity & Reachability
- **Entry**: Admin enters Device Name, IP, MAC, and Model. (Or "Claims" from a Scan).
- **Verification**: IMSys attempts to ping the IP via the Parent Router to verify reachability.

### Step 2: The Hierarchical Link
- **Parent Selection**: Admin selects the parent device (e.g., "Core Router -> Sector A").
- **Building Context**:
    - **Inherit**: Device automatically inherits the **Building/Site Name** from the parent.
    - **Override**: Admin can manually set a different Building if it is a backhaul link between sites.

### Step 3: Monitoring Assignment
- **Select Tier**: Admin chooses between **Netwatch** (Resident) or **None** (Manual Diagnostic only).
- **Auto-Config**: If Netwatch is selected, IMSys automatically pushes the "Snitch" scripts to the Core Router.

### Step 4: Finalize
- Device is saved to the DB and added to the **Monitoring Queue**. The hierarchy is now live for reporting.

## 7. The Safety Net: Reconciliation Engine (Self-Healing)

Since webhooks can be missed during network instability, a BullMQ job performs a "Double-Check" every 15-30 minutes:

### A. State Reconciliation (The Reality Check)
- **Action**: IMSys pulls the full state (PPP Active, DHCP Leases, Netwatch Status) from all routers.
- **Correction**: If the Database status differs from the Hardware reality, the Database is updated to match the Hardware.

### B. Configuration Reconciliation (The Healer)
- **Action**: IMSys verifies that all required "Snitch" scripts (Netwatch, PPP Profiles, DHCP Lease Scripts) are present and correct on the routers.
- **Correction**: Missing or altered scripts are automatically re-injected by IMSys.

## 8. Implementation Roadmap

1.  **Schema Update**: Update `Device` and `MikrotikUser` models.
2.  **Webhook Engine**: Create the unified `/api/webhooks/network-event` endpoint.
3.  **Injection Engine**: Build the utility to push Netwatch/PPP scripts to MikroTiks.
4.  **Worker Implementation**: BullMQ workers for Heartbeats and ARP batching.
5.  **UI Integration**: Add the "Parent" dropdown and "Live Check" buttons.
