# Host and Application Monitoring Plan

## 1. Introduction

This document outlines the plan for implementing host-level and basic application monitoring for the IMSys system. Effective monitoring is crucial for identifying performance bottlenecks, detecting resource exhaustion, and proactively addressing issues before they impact users or lead to system outages. This plan focuses on foundational monitoring capabilities essential for a production VPS deployment.

## 2. Why Monitoring is Crucial

Monitoring helps prevent "Nightmare Scenarios" such as:
-   **Server Resource Exhaustion:** Running out of CPU, RAM, or disk space, leading to system instability or crashes.
-   **Performance Degradation:** Slowdowns that impact user experience and application responsiveness.
-   **Unresponsive Services:** Detecting when a critical service (e.g., database, backend API) is running but not performing its function correctly.

## 3. Key Metrics to Monitor

Our monitoring solution should track the following essential metrics:

### 3.1. Host-Level Metrics

-   **CPU Utilization:** Overall CPU usage and per-core usage.
-   **Memory Usage:** Total RAM, used RAM, free RAM, swap usage.
-   **Disk I/O:** Read/write operations per second, latency.
-   **Disk Space:** Available disk space on all mounted volumes.
-   **Network Traffic:** Inbound/outbound bandwidth, packet errors.
-   **System Load Averages:** Indication of overall system activity and queue length.

### 3.2. Docker Container Metrics

-   **Container Status:** Running, stopped, unhealthy (leveraging our existing healthchecks).
-   **Container Resource Usage:** CPU, Memory, Network usage per container.

## 4. Recommended Tools

For a VPS deployment, we prioritize ease of setup, real-time visibility, and minimal resource overhead.

### 4.1. Primary Recommendation: Netdata

-   **Description:** `Netdata` is a free, open-source, real-time performance monitoring tool that provides instant insights into system and application health. It's designed for ease of installation and low resource consumption.
-   **Features:**
    -   Real-time, interactive dashboards.
    -   Monitors CPU, RAM, disk, network, processes, Docker containers, and more.
    -   Built-in alerting capabilities.
    -   Self-hosted, no cloud account required (though cloud-based options exist).
-   **Pros:** Extremely easy to install, rich dashboards out-of-the-box, low overhead.
-   **Cons:** Primarily focused on real-time; historical data retention is limited by disk space unless integrated with other tools.

### 4.2. Alternative: Cloud Provider's Native Agent

-   **Description:** Many VPS providers (e.g., AWS CloudWatch Agent, DigitalOcean Monitoring Agent) offer their own agents for basic host monitoring.
-   **Pros:** Often integrated directly into the provider's billing and dashboard, simple setup.
-   **Cons:** May offer less granular detail than dedicated tools, vendor lock-in.

## 5. Implementation Steps (Using Netdata as Example)

### Step 1: Install Netdata Agent on VPS

-   **Action:** SSH into the VPS.
-   **Action:** Run the Netdata one-liner installation script (usually `bash <(curl -Ss https://my-netdata.io/kickstart.sh)`).
-   **Verification:** Access the Netdata dashboard via `http://your_vps_ip:19999`.

### Step 2: Configure Basic Alerts

-   **Action:** Access Netdata's configuration files (e.g., `/etc/netdata/health.d/`).
-   **Action:** Review and enable/customize default alerts for critical metrics (e.g., high CPU, low disk space, high memory usage).
-   **Action:** Configure notification methods (e.g., email, Slack) if desired.

### Step 3: Monitor Docker Containers

-   **Action:** Netdata automatically detects and monitors Docker containers. Verify that container-specific metrics (CPU, RAM, network) are visible in the dashboard.
-   **Action:** Ensure Docker's healthcheck status (from `docker ps`) is reflected in Netdata's overview.

## 6. Verification

-   **Action:** Regularly check the Netdata dashboard to familiarize yourself with normal system behavior.
-   **Action:** Simulate a load or resource spike (e.g., run a CPU-intensive command) to verify that Netdata accurately reports the changes and triggers any configured alerts.
-   **Action:** Confirm that Docker container health statuses are correctly displayed.
