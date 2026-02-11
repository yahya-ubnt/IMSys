# Hierarchy and Monitoring: Current vs. Desired State (Deep Dive)

## 1. Current State Assessment

### A. Data Models (The "Flat" Foundation)
- **Entities**: `MikrotikRouter`, `Device` (CPE/AP), and `MikrotikUser` are separate models.
- **Location Context**: Each model has a flat `location` (String) field. There is no shared "Building" or "Site" anchor.
- **Linkages**: 
    - `Device` -> `MikrotikRouter`
    - `MikrotikUser` -> `MikrotikRouter` AND `Device` (as `station`)
- **Anti-Pattern**: The `routerMonitoringService.js` appends status text (e.g., `"(Offline)"`) directly to the `location` field in the database, breaking data integrity and reporting.

### B. Monitoring Architecture (The "Heavy Poll" Model)
- **Router Health**: `routerMonitoringService.js` performs bulk pings and API checks every minute (via `masterScheduler`).
- **User Status**: `userMonitoringService.js` performs bulk checks of `/ppp/active/print` (PPPoE) or `/ping` (Static) per router.
- **On-Demand**: `getMikrotikUserStatus` in `mikrotikUserController.js` opens a *new* API connection just to check a single user's status.
- **Issue**: High CPU usage on both the IMSys server and MikroTik routers due to redundant, non-persistent API connections.

### C. BullMQ Progress (Partly Done)
- **Existing Queue**: `MikroTik-Sync` is operational.
- **Existing Jobs**:
    - `addUser`, `updateUser`, `disconnectUser`, `connectUser`: Already handle background provisioning.
    - `reconcileMikrotikState`: Runs every 15 minutes to align DB with Router secrets/queues.
- **The Gap**: Monitoring (Health checks) is still trapped in `node-cron` scripts and hasn't been moved to the "Durable Job" model.

---

## 2. Desired State (The "Lean & Event-Driven" Model)

### A. Hierarchy: Building-First
1. **Building Model**: A new `Building` entity serves as the physical site anchor.
2. **Clean-Up**: `location` fields in Routers/Devices are replaced by a `building` Reference.
3. **Inheritance**: Users inherit their "Building Context" from the `Device` they are connected to.

### B. Monitoring: "Snitch & Heartbeat"
1. **PPPoE & Static (Push)**: mikroTik Webhooks (On-Up/On-Down/On-Bound) provide **instant** status updates.
2. **Infrastructure (Heartbeat)**: BullMQ Job pings the Core Router every 60s.
3. **Infrastructure (Snitch)**: Devices (APs/Backhauls) use Netwatch to report status via webhooks.

### C. Logic: "State-Based Sync"
- We stop sending "commands" and start defining "desired states." 
- **Example**: To disconnect a user, we set `isSuspended: true` in the DB. The `MikroTik-Sync` worker persistently tries to make that a reality on the router.

---

## 3. The Cleanup & Migration Path (File Impact)

| Area | Current File | New Approach / Replacement |
| :--- | :--- | :--- |
| **Models** | `MikrotikRouter.js`, `Device.js` | Add `building` ObjectId reference. Remove status-string hacks from `location`. |
| **Models** | N/A | Create `Building.js`. |
| **Monitoring** | `routerMonitoringService.js` | Replace with `monitoringWorker.js` (BullMQ Heartbeat). |
| **Monitoring** | `userMonitoringService.js` | **DEPRECATE**. Status updates will be event-driven (Webhooks). |
| **Status API** | `mikrotikUserController.js` | `getMikrotikUserStatus` will return the cached `isOnline` status from the DB instead of hitting the API. |
| **Reconciliation** | `reconciliationJob.js` | Update to also verify the presence of "Snitch" scripts (Webhooks/Netwatch). |
| **Webhooks** | N/A | Create `webhookRoutes.js` and `webhookController.js`. |

## 4. Webhook Implementation Detail

Webhooks will be coded into a new controller `webhookController.js`.

- **Route**: `POST /api/webhooks/mikrotik/ppp-status`

- **Logic**: 

    1. Validate Router (verify source IP/Token).

    2. Match `username` to `MikrotikUser`.

    3. Update `isOnline` and log `UserDowntimeLog` if necessary.

    4. **Hierarchy Check**: If the parent is DOWN, suppress alerts.



## 5. The Intelligent Detective: Diagnostic Tree-Walk



The Tree-Walk is a core logic path triggered in three specific scenarios to ensure data accuracy and alert sanity.



### A. Trigger Scenario 1: Event-Driven Webhooks (The "Push" Trigger)

- **Source**: MikroTik Router (PPP On-Down, DHCP On-Unbound, Netwatch Down-Script).

- **Immediate Action**: Before the Database marks the user/device as `DOWN`, the Webhook Controller triggers a **Parent Spot-Check**.

- **Logic**: It pings the parent (Sector AP) to see if the "Down" signal is part of a larger outage. If the parent is DOWN, the child alert is suppressed.



### B. Trigger Scenario 2: Scheduled Polling (The "Pulse" Trigger)

- **Source**: BullMQ Heartbeat Job (60s).

- **Immediate Action**: If a ping fails or an API request times out, the Worker initiates an upward Tree-Walk before marking the device as offline.

- **Logic**: It verifies the uplink health. If the parent is unreachable, the failure is escalated to the parent's level, and the child is marked as "Impacted" rather than "Broken."



### C. Trigger Scenario 3: Manual UI Interaction (The "Support" Trigger)

- **Source**: Admin Dashboard ("Live Check" button).

- **Immediate Action**: The system performs an instant "Root-to-Leaf" diagnostic path.

- **Visual Result**: The admin sees a real-time status of every hop: `Core [UP] -> Sector [UP] -> Station [DOWN]`.



### D. Actionable Routing (Getting to the Right People)

- **Network Admin (Level 3)**: Notified via SMS/High-Priority Alert for **Core/Site** failures.

- **Field Technicians (Level 2)**: Notified for **Sector/Backhaul** failures with Building Name context.

- **Support Agents (Level 1)**: See **Individual User** disconnections on the dashboard for reactive troubleshooting.



## 7. Asynchronous Diagnostic Pipeline (BullMQ)







To ensure the system remains responsive during mass outages, the diagnostic and alert logic is fully decoupled into a BullMQ pipeline.







### A. The Three-Stage Pipeline



1. **Detection Stage**: A Webhook or Poll detects a "DOWN" event and pushes a job to the `monitoring-queue`.



2. **Diagnostic Stage (The Worker)**: The Monitoring Worker picks up the job and executes the **Recursive Tree-Walk**. It performs the high-priority pings to parents to identify the root cause.



3. **Alerting Stage**: Once the root cause is confirmed, a job is passed to the `notification-queue` to send the final, suppressed alert to the correct personnel.







### B. Benefits of Async Diagnostics



- **Scalability**: Handles hundreds of simultaneous disconnections without blocking the main API thread.



- **Backoff & Retries**: If a diagnostic ping fails due to a network glitch, BullMQ retries the check automatically.



- **Throttling**: Prevents overwhelming the Core Router by limiting the number of concurrent diagnostic pings.




