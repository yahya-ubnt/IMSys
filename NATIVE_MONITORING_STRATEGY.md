# IMSys Unified Network Monitoring & Discovery (NATIVE)

This document outlines the strategy for a fully integrated, high-performance monitoring system built directly into IMSys. By leveraging **BullMQ**, **Redis**, and the **MikroTik API**, we eliminate the need for external tools like LibreNMS while providing a more seamless experience for ISPs.

---

## 1. Core Philosophy: "Business-Aware Monitoring"
Unlike general monitoring tools, IMSys knows *who* owns a device. The monitoring is not just about IPs; it's about customer satisfaction, billing, and automated troubleshooting.

---

## 2. User Status Monitoring (PPPoE & Static)

### A. PPPoE Users: Real-Time "Push" Status
*   **Method:** MikroTik Webhooks (Event-Driven).
*   **How it works:** 
    *   The MikroTik `PPP Profile` (On-Up/On-Down) is configured with a 1-line script.
    *   **On-Up:** Router hits `IMSys/api/webhooks/ppp-status?user=XXX&status=online`.
    *   **On-Down:** Router hits `IMSys/api/webhooks/ppp-status?user=XXX&status=offline`.
*   **Impact:** **0% Server Polling Overhead.** Status updates are instant (sub-second).
*   **Automation:** IMSys automatically injects these scripts into the router profiles via API on first connection.

### B. Static Users: "Proxy-ARP" Monitoring
*   **Method:** BullMQ Worker + MikroTik API (Proxy).
*   **How it works:**
    *   **Worker** connects to the Core Router API and checks the **ARP Table** (`/ip arp print where address=X.X.X.X`).
    *   **Why:** Solves the "different LAN" problem. The router pings its own local neighbors and reports back.

---

## 3. Infrastructure Monitoring: The "Snitch & Heartbeat" Model

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

## 4. Discovery & Hierarchy (The "Scout")

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

## 5. Performance & Health (No-SNMP History)

We replace heavy SNMP graphs with lightweight "Snapshot Data" stored directly in MongoDB.

*   **Metric Collection:** Every 10 minutes, a BullMQ job grabs:
    *   **Latency (ms):** To detect link quality.
    *   **Signal Strength (dBm):** Fetched via MikroTik API (Wireless Registration Table).
*   **Storage:** Data is saved in a capped collection for 30 days.
*   **Visualization:** Native React charts inside the IMSys profile.

---

## 5. Why This Beats External Tools (LibreNMS)

1.  **Unified Experience:** One login, one dashboard, one mobile-responsive UI.
2.  **Ease of Adoption:** No SNMP setup required for basic monitoring. If the Core Router can see it, IMSys can monitor it.
3.  **Low Resource Footprint:** No extra VPS required. The entire monitoring engine runs in your existing Redis/Node.js stack.
4.  **Integrated Troubleshooting:** When a support ticket is opened, the technician sees the "last 24-hour signal graph" right next to the ticket.
---

## 6. Implementation Roadmap

1.  **Phase 1 (The Worker):** Refactor current polling into BullMQ jobs (one job per router).
2.  **Phase 2 (The Webhook):** Create the API endpoint for MikroTik PPP scripts to "Push" status updates.
3.  **Phase 3 (The Scout):** Implement the "Neighbor Scan" button using the MikroTik API.
4.  **Phase 4 (The Chart):** Add the History collection and simple frontend graphs.
