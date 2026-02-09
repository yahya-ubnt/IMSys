# Monitoring System: Current State & Refactor Plan

## 1. The Situation (Current State)
The IMSys monitoring system currently tracks the "Up/Down" status of three main entities: **Mikrotik Routers**, **Network Devices (APs/CPEs)**, and **Mikrotik Users**. 

- **Scheduler:** Managed by `masterScheduler.js` using `node-cron` and `child_process.spawn`.
- **Logic:** Synchronous, inefficient loops that iterate through every device once per minute.
- **Data Fetching:** On-demand, direct-to-device data pulls are used for UI elements like live traffic graphs, causing high load on network devices.

## 2. The Problem (The Bottleneck)
The current system, while functional for a small scale, suffers from major architectural flaws that prevent scalability and create operational noise.

- **"Tsunami of Timeouts":** The system lacks true dependency awareness. If an Access Point goes down, the system still attempts to ping all 50+ child stations individually, wasting minutes of processing time.
- **"Alert Storms":** This lack of hierarchy floods administrators with dozens of individual alerts for a single root-cause failure, making it difficult to identify the actual problem.
- **High Server & Device Load:** The combination of the every-minute monitoring loop and direct-to-device UI data pulls puts significant, unnecessary strain on both the application server and the network hardware itself.

## 3. Architectural Decision: Build vs. Integrate
A decision was made between building a custom monitoring solution and integrating a professional open-source Network Monitoring System (NMS).

**Recommendation: Integrate LibreNMS.**

While this approach requires managing another service, the benefits are overwhelming:
- **Massively Reduced Development Time:** We build an API client, not an entire NMS.
- **Vastly Superior Features:** We gain auto-discovery, historical performance graphing, broad device support, and a robust hybrid monitoring engine (Polling + Push) out of the box.
- **Focus on Core Business:** It allows us to offload the solved problem of network monitoring and focus on the unique features of the IMSys platform.

---

## 4. The Fix (Enterprise-Grade Refactor)

The refactor will replace the inefficient, custom-built monitoring script and data-pulling methods with the professional LibreNMS solution.

### Principle: True Dependency Suppression
A core principle is to move from a "flat" monitoring list to a true dependency tree (`Router -> Access Point -> Station`). The old system treated all devices as independent, leading to "alert storms" and wasted resources. The new system will use this hierarchy to make intelligent decisions. If a parent device (like an Access Point) is down, the system will not attempt to poll its children, instead marking them as `UNREACHABLE`. This is a foundational feature of LibreNMS that we will leverage through proper configuration.

### Deprecating the Partial Solution
The investigation confirmed that a partial, two-level suppression system exists in `userMonitoringService.js`. This logic correctly groups users by their parent router and sends a consolidated alert if the router is unreachable. While this was an intelligent partial solution for `Router -> User` failures, it does not handle deeper `AP -> Station` dependencies. The introduction of LibreNMS makes this custom logic entirely redundant. As part of the cleanup post-migration, this service will be refactored to remove this legacy monitoring code.

A deeper look at this service also reveals the core cause of the "Tsunami of Timeouts." To prevent false positives from single dropped packets, the code contains a retry loop. For a truly offline device, this well-intentioned fix has an unintended consequence:
- **The Timeout Cascade:** The code will attempt to ping an offline device 3 times, with a 5-second timeout and 1-second delay for each attempt. Confirming a single offline device can take up to 17 seconds.
- **The "Tsunami":** When an Access Point with 50 stations goes down, the script performs this 17-second routine for *each station*. This creates a massive delay cascade that freezes the monitoring for minutes at a time.

This confirms that simply handling timeouts is not enough; only a true hierarchical system like LibreNMS can solve this problem efficiently.

### Phase 1: Deploy and Integrate LibreNMS

**Step 1: Deploy LibreNMS**
*   Set up LibreNMS using its official Docker container.

**Step 2: Intelligent Configuration**
*   This is the most critical step to unlock the full potential of the NMS.
*   **Define IP Ranges:** Configure the network ranges for LibreNMS to scan (e.g., `192.168.0.0/24`). This allows the discovery of both static and auto-assigned IPs.
*   **Define Device Dependencies:** Explicitly configure parent/child relationships for all network hardware. This is the key to enabling automatic dependency suppression.
*   **Enable Push-Based Alerts:** Configure LibreNMS to receive Syslog and SNMP Traps for instant, real-time notifications.
*   **Tune Polling & Alerting:** Adjust polling intervals and alerting rules based on device criticality.

**Step 3: Develop IMSys API Client**
*   Create a new service within the IMSys backend to query the LibreNMS API. This client will fetch device statuses and performance data, emitting internal events (e.g., `device:down`) to plug into the existing notification chain.

### Phase 2: Workflow and UI Integration

**Step 1: Implement Auto-Discovery Workflow**
*   Leverage LibreNMS's discovery feature with an "approval" step to provide a balance of automation and control.
*   A new UI page, "Network Discovery," will be created.
*   A scheduled job will query LibreNMS for newly discovered devices and populate them into this UI for admin approval. This workflow also helps in identifying unauthorized or "rogue" devices.
*   An on-demand "Scan Network Now" button will also be added to trigger an immediate scan for urgent cases.

**Step 2: Seamless Hierarchy Management**
*   The IMSys "Create/Edit Device" page will be updated with a "Parent Device" dropdown.
*   When a parent is set in our UI, a backend API call will update the relationship in LibreNMS, ensuring a seamless workflow.

## 5. Expected Outcome
1. **Drastically Improved Application Stability:** The IMSys application server will no longer bear the high CPU/memory load of constant device polling.
2. **Professional-Grade Monitoring:** The system gains a full suite of monitoring tools, including historical data, advanced alerting, and support for thousands of devices.
3. **Intelligent and Actionable Alerting:** By leveraging dependency suppression, "alert storms" will be eliminated, and admins will receive single, root-cause alerts.
4. **Seamless Admin Workflow:** Critical configurations like hierarchy and device discovery will be managed from within the IMSys UI, not a separate platform.
5. **Consolidated Data Fetching:** Inefficient, on-demand data pulls for UI elements (like live bandwidth graphs) will be deprecated and served efficiently from the LibreNMS API, reducing load on network devices and improving UI responsiveness.
6. **Richer Data & Proactive Diagnostics:** The UI will be enhanced with valuable new time-series data from LibreNMS, including historical traffic graphs and interface error/discard rates. This moves the admin from a purely reactive stance to proactive problem-solving by allowing them to spot physical layer issues (like bad cables) and analyze historical usage patterns. It also enables accurate tracking of total data consumption (e.g., GB per month) for the first time.
