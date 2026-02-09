# IMSys Unified Network Monitoring & Discovery (NATIVE)

This document outlines the strategy for a fully integrated, high-performance monitoring system built directly into IMSys. By leveraging **BullMQ**, **Redis**, and the **MikroTik API**, we eliminate the need for external tools like LibreNMS while providing a more seamless experience for ISPs.

---

## 1. Core Philosophy: "Business-Aware Monitoring"
Unlike general monitoring tools, IMSys knows *who* owns a device. The monitoring is not just about IPs; it's about customer satisfaction, billing, and automated troubleshooting.

---

## 2. Two Types of Reconciliation: A Critical Distinction
It is crucial to understand that IMSys performs two different types of "reconciliation," each with a different purpose and a different "source of truth."

### A. Monitoring Reconciliation (The "Reporter")
*   **Purpose:** To ensure the IMSys database has an accurate picture of the network's real-time health.
*   **Question:** *"Is my database's `UP`/`DOWN` status for this device correct?"*
*   **Source of Truth:** **The Hardware (Router).** If the router says a device is down, the database is updated to match reality.

### B. Billing/Service Reconciliation (The "Enforcer")
*   **Purpose:** To enforce business rules and ensure network services match what a customer has paid for.
*   **Question:** *"Is this user's active session on the router allowed by their current subscription status in my database?"*
*   **Source of Truth:** **The IMSys Database.** If the database says a user's plan has expired, the system forces the router to disconnect the user.

---

## 3. User Status Monitoring (PPPoE & Static)

### A. PPPoE Users: Real-Time "Push" Status
*   **Method:** MikroTik Webhooks (Event-Driven).
*   **How it works:** 
    *   The MikroTik `PPP Profile` (On-Up/On-Down) is configured with a 1-line script.
    *   **On-Up:** Router hits `IMSys/api/webhooks/ppp-status?user=XXX&status=online`.
    *   **On-Down:** Router hits `IMSys/api/webhooks/ppp-status?user=XXX&status=offline`.
*   **Impact:** **0% Server Polling Overhead.** Status updates are instant (sub-second).
*   **Automation:** IMSys automatically injects these scripts into the router profiles via API on first connection.

### B. Static Users: Active "Proxy-Ping" Monitoring
*   **Method:** BullMQ Worker + MikroTik API (Proxy).
*   **How it works:**
    *   To get a definitive, real-time status for static IP users, the **Worker** connects to the Core Router API and executes an active `/ping` command for the user's specific IP address (e.g., `/ping 192.168.88.50 count=1`).
    *   The worker parses the response to determine if the device is reachable. This provides a reliable, momentary snapshot of the device's status.
*   **Why:** This approach uses the router as an in-network "proxy," solving the "different LAN" problem. It allows the central server to monitor devices on private networks without requiring complex routing or compromising security. While slightly more resource-intensive than a passive ARP check, it guarantees accuracy.

---

## 4. Infrastructure Monitoring: The "Snitch & Heartbeat" Model

To avoid the complexity and overhead of SNMP, we use an event-driven "Snitch" model for antennas and a "Heartbeat" for core routers.

### A. The "Snitch" (MikroTik Netwatch)
For Antennas, Sector APs, and Switches, we don't poll from the server. Instead, we let the **Core Router** monitor them locally.
*   **Mechanism:** MikroTik **Netwatch**.
*   **Logic:** 
    1.  The Core Router is programmed to ping its children (APs/Antennas) every 30 seconds.
    2.  If an AP fails, the Core Router triggers a "Down Script."
    3.  The script "snitches" to the IMSys server via a Webhook: `IMSys/api/webhooks/device-status?id=XXX&status=down`.
*   **Benefit:** Instant reporting of tower failures without the server ever lifting a finger.

### B. The "Heartbeat" (Server Polling)
Since a Core Router cannot report its own death, the server performs a lightweight heartbeat check.
*   **Mechanism:** BullMQ Heartbeat.
*   **Logic:** The server pings the **Core Router IP** (WireGuard Tunnel) once every 60 seconds.
*   **Scale:** Because there are few Core Routers (compared to thousands of devices), this has negligible impact on server performance.

---

## 5. The "Self-Healing" Reconciliation Job (for Monitoring)

To protect against missed webhooks (e.g., during a network blip) or accidental misconfigurations, a scheduled BullMQ job runs every 30-60 minutes to perform a "double-check." This is the safety net that makes the system truly enterprise-grade.

The job performs two and only two functions:
1.  **Verify Configuration (The Rules):** It asks the router for a list of all its Netwatch rules. It compares this list to what IMSys expects to be monitored. If an ISP admin accidentally deleted a rule, IMSys automatically re-creates it.
2.  **Verify State (The Status):** It asks the router for the current `UP`/`DOWN` status of all monitored devices. If the router's reality (e.g., `status=down`) does not match the IMSys database (e.g., `status="UP"`), IMSys corrects its own database and triggers any necessary alerts.

This process ensures the monitoring system is resilient and automatically heals itself over time.

---

## 6. Discovery & Hierarchy (The "Scout")

### A. Zero-Config Discovery via MNDP
*   **Method:** MNDP/LLDP via MikroTik Neighbors (`/ip neighbor print`).
*   **Workflow:**
    1.  Admin clicks **"Scan Tower"** in IMSys.
    2.  System asks the Core Router who it sees physically connected.
    3.  It finds Antennas and Switches automatically, even if they have no configuration.
    4.  Admin clicks "Add," and the system automatically creates the monitoring link.

### B. Automatic Hierarchy (Topology Mapping)
*   **How it works:** 
    *   Devices discovered via "Router A" are saved with `parentId: RouterA`.
    *   This creates a 3-tier tree: `Core Router > Sector AP > Client Antenna`.
*   **Smart Alerts (Suppression):** If a Core Router goes down, the system **silences** the 500 individual client alerts and sends only **one** alert for the Root cause.

---

## 7. Performance & Health (No-SNMP History)

We replace heavy SNMP graphs with lightweight "Snapshot Data" stored directly in MongoDB.

*   **Metric Collection:** Every 10 minutes, a BullMQ job grabs:
    *   **Latency (ms):** To detect link quality.
    *   **Signal Strength (dBm):** Fetched via MikroTik API (Wireless Registration Table).
*   **Storage:** Data is saved in a capped collection for 30 days.
*   **Visualization:** Native React charts inside the IMSys profile.

---

## 8. Why This Beats External Tools (LibreNMS)

1.  **Unified Experience:** One login, one dashboard, one mobile-responsive UI.
2.  **Ease of Adoption:** No SNMP setup required for basic monitoring. If the Core Router can see it, IMSys can monitor it.
3.  **Low Resource Footprint:** No extra VPS required. The entire monitoring engine runs in your existing Redis/Node.js stack.
4.  **Integrated Troubleshooting:** When a support ticket is opened, the technician sees the "last 24-hour signal graph" right next to the ticket.
---

## 9. Implementation Roadmap

1.  **Phase 1 (The Worker):** Refactor current polling into BullMQ jobs (one job per router).
2.  **Phase 2 (The Webhook):** Create the API endpoint for MikroTik PPP scripts to "Push" status updates.
3.  **Phase 3 (The Scout):** Implement the "Neighbor Scan" button using the MikroTik API.
4.  **Phase 4 (The Chart):** Add the History collection and simple frontend graphs.
