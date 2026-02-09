# IMSys Monitoring & Discovery Strategy

This document outlines the architectural approach for monitoring users (PPPoE & Static) and network infrastructure (Antennas, APs, Switches) across multiple tenants using a hybrid model of **BullMQ**, **MikroTik Webhooks**, and **LibreNMS**.

---

## 1. User Monitoring (IMSys Native)

Monitoring for users is handled directly by the IMSys backend because the status (Online/Offline) is tightly coupled with billing, auto-disconnection, and customer support dashboards.

### A. PPPoE Users: The "Push" Method (Primary)
To achieve near-zero CPU usage on the server and instant status updates, we use MikroTik's native scripting engine.

*   **Mechanism:** Webhooks.
*   **Logic:**
    1.  In the MikroTik `PPP Profile`, we add an `On-Up` and `On-Down` script.
    2.  When a user connects, the router sends a small HTTP GET request to the IMSys Webhook API:
        `http://server-ip/api/v1/webhooks/ppp?user=$user&status=up&router=$routerId`
    3.  The IMSys backend updates the `isOnline` status in MongoDB instantly.
*   **Benefit:** No polling required. The server only works when a user actually connects or disconnects.

### B. Static Users: The "Proxy" Method (BullMQ)
Since static users don't "log in," we must poll them. To avoid the "LAN Conflict" and "Routing" issues, we use the Core Router as a proxy.

*   **Mechanism:** BullMQ + MikroTik API.
*   **Logic:**
    1.  **Master Scheduler** adds a `CHECK_STATIC_USERS` job to the Redis queue for each router every 5 minutes.
    2.  **BullMQ Worker** connects to the MikroTik API over the WireGuard tunnel.
    3.  Instead of a standard Ping, the worker runs `/ip arp print where address=X.X.X.X`.
    4.  If the MAC address is present and active, the user is marked **Online**.
*   **Benefit:** Solves the "different LAN" problem because the router pings/checks its own local neighbors. BullMQ ensures that one slow router doesn't lag the entire system.

---

## 2. Infrastructure Monitoring (LibreNMS)

For backbone infrastructure (Antennas, Sector APs, Backhaul links), we leverage **LibreNMS** to provide professional-grade health data and historical performance graphs.

### A. Ease of Adoption: IP-Only Monitoring
We recognize that technicians often won't configure SNMP on every device.
*   **Discovery:** Users can add devices by IP address only.
*   **ICMP Mode:** LibreNMS is configured to monitor these via "Ping Only." This provides:
    *   Up/Down Status.
    *   Latency (ms) Graphs (to detect "laggy" links).
    *   Uptime history.
*   **Zero Config:** No changes are needed on the Antenna/AP side.

### B. Advanced Monitoring: SNMP (Optional)
If a device has SNMP enabled (e.g., Ubiquiti or MikroTik), LibreNMS automatically upgrades the monitoring to include:
*   **Signal Strength (dBm) & SNR.**
*   **CCQ / Link Quality.**
*   **Interface Traffic (Mbps).**
*   **CPU/RAM usage of the AP.**

---

## 3. Network Discovery & Hierarchy

To make the system "Easy to Use," we use the Core Routers as "Scouts" to find devices automatically.

1.  **MNDP/CDP Scan:** The system runs `/ip neighbor print` on the Core Router via the API.
2.  **Candidate List:** Any device found (Antennas, Switches) that isn't already in the database is shown to the Admin.
3.  **One-Click Add:** The Admin clicks "Monitor," and the device is added to both IMSys (for basic tracking) and LibreNMS (for graphing).
4.  **Hierarchy:** Because the device was found by "Router A," it is automatically mapped as a child of that router in the network map.

---

## 4. Technical Bottlenecks & Solutions

| Bottleneck | Solution |
| :--- | :--- |
| **API Connection Limits** | Use **BullMQ** to ensure we only open 1 connection per router at a time. |
| **Network Latency** | **BullMQ Workers** run in parallel (Concurrency: 50+), so 1000 pings take seconds, not minutes. |
| **Conflicting LAN IPs** | All monitoring is proxied through the **MikroTik Router API** via its unique WireGuard Tunnel IP. |
| **Server CPU Load** | Offload heavy graphing and SNMP polling to a separate **LibreNMS instance**. |

---

## 5. Summary of Responsibilities

*   **IMSys Backend:** Billing, User Status (On/Off), Auto-Disconnection, Customer Support.
*   **Redis/BullMQ:** The "Engine" that manages the timing and execution of all status checks.
*   **LibreNMS:** The "Doctor" that keeps track of link quality, signal, and historical network health.
