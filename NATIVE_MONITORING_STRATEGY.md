# IMSys Unified Network Monitoring & Discovery (NATIVE)

This document outlines the strategy for a high-performance monitoring system. The **IMSys Server** acts as the central "Brain," polling the network via a secure **WireGuard Tunnel** to ensure CPU safety for the ISP core routers.

---

## 1. Core Philosophy: "Business-Aware Monitoring"
IMSys doesn't just monitor IPs; it monitors the business relationship between a Core Router, a Sector AP, and a Customer.

---

## 2. User Status Monitoring (PPPoE & Static)

### A. PPPoE Users: Real-Time "Push" Status
*   **Method:** MikroTik Webhooks (Event-Driven).
*   **Mechanism:** MikroTik `PPP Profile` (On-Up/On-Down) scripts hit IMSys API endpoints.
*   **CPU Impact:** **Zero Polling.** Only fires when a session changes.
*   **Diagnostic Lever:** Every PPPoE user has a **"Live Check"** button in the dashboard. This triggers a manual **Proxy-Ping** from the Core Router to the user's IP to verify latency and packet loss during troubleshooting.
*   **Safety:** IMSys automatically injects/verifies these scripts during router reconciliation.

### B. Static Users: The "Passive ARP Observer"
*   **Method:** Server-led API check of the Core Router's ARP table (`/ip arp print`).
*   **Logic:** If a static user's MAC is in the router's ARP table, they are marked **ONLINE**.
*   **Lever:** For troubleshooting, an admin can toggle **Active Proxy-Ping** for a specific user, which forces the router to ping that IP once per cycle.

---

## 3. Infrastructure Monitoring: The "Hierarchical" Model

To protect the core router's CPU and ensure technical accuracy, IMSys uses a **Hierarchical Polling** model. The **IMSys Server** connects directly to the device that "owns" the connection Layer via the VPN.

### A. Monitoring Tiers

| Tier | Method | Target | Source Device | Frequency |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Resident** | **Netwatch** | Backbone | Core Router | Real-time |
| **Tier 2: Passive** | **Wireless Table** | Client Antennas | **Sector AP** | 5-10 Mins |
| **Tier 3: Active** | **ARP/Ping** | Static Users | Core Router | 5-10 Mins |

### B. The "One-Shot" Distributed Job
1.  **Core Heartbeat (Every 60s):** The IMSys Server pings the Core Router via the WireGuard tunnel.
2.  **AP Snapshot (Every 10m):** The Server loops through all registered **Sector APs**. It connects to each AP and pulls the local `/interface wireless registration-table` to update Signal/CCQ for all connected antennas at once.
3.  **Result:** Minimal API hits on the Core Router; targeted polling on the APs where the wireless "truth" lives.

---

## 4. Device Management: Manual Entry & Human Context

We do not wait for devices to "appear." We provide a robust entry system that prioritizes human-readable alerts over technical IPs.

### A. The "Contextual Identity"
Every device (Manual or Claimed) supports:
1. **Site/Building Name:** Human label for the physical location (e.g., "Blue Plaza").
2. **Installation Note:** Specific placement details (e.g., "North facing on the water tank").
3. **Location Inheritance (Smart Latching):** To minimize typing, a device automatically inherits the "Site Name" from its Parent (e.g., a Sector AP) unless overridden.

### B. Two Paths to Monitoring
*   **Path 1: Manual Entry (Primary):** Admin enters Name, MAC, IP, and selects the Parent. IMSys verifies the connection and sets up the monitoring tier.
*   **Path 2: Guided Discovery (Assistant):** Admin triggers a scan. IMSys shows "Unmanaged" devices found in Neighbor/Wireless tables. Admin "Claims" them and assigns a Parent/Site in one click.

---

## 5. Smart Alerts (Hierarchy Suppression)

The hierarchy is used to prevent "Alert Storms."
*   **Logic:** Before alerting for an Antenna, the Alert Worker checks the status of its **Parent** (Sector AP) and **Grandparent** (Core Router).
*   **Action:** If the Parent is DOWN, the child alert is **suppressed**. The admin receives one notification: *"Sector AP North is DOWN (Affecting 45 users)."*

---

## 6. Access & Security (How we log in)

### A. Credential Inheritance
* **Automagic Login:** APs can be set to "Inherit Credentials" from their Parent Core Router to save the admin from re-typing passwords.
* **Encryption:** All management credentials (loginUsername/loginPassword) are stored using AES-256 encryption.

### B. VPN-Backed Web UI (Troubleshooting)
* **Direct Access:** Every device in the dashboard has a "Web UI" button.
* **The "Key" Workflow:** If the Admin has their WireGuard VPN active (the "Key" icon on mobile), clicking the button opens the device's internal management page directly in their browser.

---

## 7. Implementation Levers (Safety Valves)

The admin has "Levers" in the settings to tune the system if the router is weak:
*   **Lever 1: Snapshot Interval:** Increase from 10m to 30m to reduce API hits.
*   **Lever 2: Passive-Only Mode:** Disable all Netwatch rules and rely entirely on the 10-minute API snapshots.
*   **Lever 3: VIP Selection:** Manually select which 5-10 devices are "critical enough" to warrant a real-time Netwatch script.
