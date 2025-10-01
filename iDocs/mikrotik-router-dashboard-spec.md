# Technical Specification: MikroTik Router Dashboard

## 1. Module Overview and Purpose

The MikroTik Router Dashboard module will provide a dedicated, real-time management interface for individual MikroTik routers directly within the existing ISP management system. The primary purpose is to centralize router administration, eliminating the need for administrators to switch between the billing system and MikroTik's WebFig/WinBox.

This module will replicate core WebFig functionality by communicating directly with the RouterOS API (port 8728). It will not use iframes. This approach ensures a seamless user experience, consistent UI, and enhanced security by proxying all communication through the application's backend.

## 2. System Flow (Admin Interaction)

1.  **Navigation**: The administrator logs into the ISP management system and navigates to the "MikroTik Routers" section.
2.  **Router Selection**: A list of all configured MikroTik routers is displayed. Each row will have a "Dashboard" button.
3.  **Dashboard Access**: The admin clicks the "Dashboard" button for a specific router (e.g., "Main-Branch-Router").
4.  **Page Load**: The application opens a new page, the "Router Dashboard," identified by the router's ID in the URL (e.g., `/routers/dashboard/60d5f1b3e0b3f8a2a4c9d4e2`).
5.  **Data Fetching**: Upon loading, the frontend makes an initial API call to the backend to fetch the router's overview status (system resources, uptime).
6.  **Interaction**: The dashboard presents data in a tabbed interface (Overview, Interfaces, PPPoE, etc.). The admin can switch between tabs to view different aspects of the router.
7.  **Actions**: The admin can perform actions, such as disconnecting an active PPPoE user. This triggers an API call from the frontend to the backend, which then sends the corresponding command to the MikroTik router via the RouterOS API. The UI updates to reflect the change.

## 3. Database Schema

The connection details for each MikroTik router will be stored in the `mikrotikrouters` collection. The schema will align with the existing `MikrotikRouter.js` model.

**Collection Name**: `mikrotikrouters`

| Field Name | Data Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the router entry. | Yes |
| `name` | String | A user-friendly name for the router (e.g., "HQ-Router-1"). | Yes |
| `ip` | String | The IP address or hostname of the router. | Yes |
| `port` | Number | The RouterOS API port. Default: `8728`. | Yes |
| `username` | String | The username for API authentication. | Yes |
| `password` | String | The **encrypted** password for the API user. | Yes |
| `createdAt` | Date | Timestamp of when the record was created. | Yes |
| `updatedAt` | Date | Timestamp of the last update. | Yes |

## 4. Backend API Endpoints

All endpoints will be prefixed with `/api/routers/:routerId/dashboard`, where `:routerId` is the MongoDB `_id` of the router. A middleware will be responsible for fetching the router's credentials from the database, decrypting the password, and establishing a connection to the router for each request.

**Recommended Node.js Library**: `node-routeros`

---

**Middleware (`connectToRouter`)**
-   Extracts `:routerId` from the request parameters.
-   Finds the router in the database. If not found, returns a 404 error.
-   Decrypts the router's password.
-   Uses `node-routeros` to connect to the router's IP and port with the credentials.
-   If connection fails, returns a 500-level error.
-   Attaches the active API connection object to the request for use in the controller.

---

| Method | Endpoint | RouterOS Command(s) | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/status` | `/system/resource/print` | Get system resource information (CPU, memory, uptime). |
| `GET` | `/interfaces` | `/interface/print`, `/interface/monitor-traffic` | Get a list of all interfaces and their real-time traffic stats. |
| `GET` | `/pppoe/active` | `/ppp/active/print` | Get a list of all active PPPoE sessions. |
| `POST` | `/pppoe/active/disconnect` | `/ppp/active/remove` | Disconnect a specific PPPoE user. Requires the user's `.id`. |
| `GET` | `/pppoe/secrets` | `/ppp/secret/print` | Get all configured PPPoE accounts (secrets). |
| `POST` | `/pppoe/secrets` | `/ppp/secret/add` | Add a new PPPoE secret. |
| `PUT` | `/pppoe/secrets/:secretId` | `/ppp/secret/set` | Update an existing PPPoE secret. |
| `DELETE` | `/pppoe/secrets/:secretId` | `/ppp/secret/remove` | Delete a PPPoE secret. |
| `GET` | `/queues` | `/queue/simple/print` | Get a list of all simple queues. |
| `GET` | `/firewall/filter` | `/ip/firewall/filter/print` | Get all firewall filter rules. |
| `GET` | `/dhcp-leases` | `/ip/dhcp-server/lease/print` | Get all active DHCP server leases. |
| `GET` | `/logs` | `/log/print` | Get the latest system log entries. |

## 5. Frontend Structure

The dashboard will be a single-page application view with a clear, tabbed layout.

-   **Main Container**:
    -   **Header**: Displays the router's name (e.g., "Dashboard for HQ-Router-1").
    -   **Tab Navigation**: A component to switch between different views.

-   **Tabs**:
    1.  **Overview**:
        -   **Component**: `SystemInfoCard`.
        -   **Content**: Displays key stats from the `/status` endpoint: CPU Load, Uptime, Free Memory, Board Name, RouterOS Version.
    2.  **Interfaces**:
        -   **Component**: `InterfacesTable`.
        -   **Content**: A table listing all network interfaces.
        -   **Columns**: Name, Type, Status (Running/Stopped), RX Rate, TX Rate.
        -   **Note**: RX/TX stats should be polled every 3-5 seconds.
    3.  **PPPoE**:
        -   **Sub-Tabs**: "Active Sessions" and "Secrets".
        -   **Active Sessions Component**: `PppoeActiveTable`.
            -   **Columns**: User, Service, Uptime, IP Address, MAC Address.
            -   **Actions**: A "Disconnect" button in each row.
        -   **Secrets Component**: `PppoeSecretsTable`.
            -   **Columns**: Name, Service, Profile, Remote Address.
            -   **Actions**: Add, Edit, and Delete buttons for managing accounts.
    4.  **Queues**:
        -   **Component**: `QueuesTable`.
        -   **Content**: A table listing simple queues.
        -   **Columns**: Name, Target, Max Limit (Upload/Download), Current Rate.
    5.  **Firewall**:
        -   **Component**: `FirewallRulesTable`.
        -   **Content**: A table listing firewall filter rules.
        -   **Columns**: #, Chain, Action, Protocol, Src. Address, Dst. Address.
    6.  **DHCP Leases**:
        -   **Component**: `DhcpLeasesTable`.
        -   **Content**: A table of active DHCP leases.
        -   **Columns**: IP Address, MAC Address, Client ID, Server, Status.
    7.  **Logs**:
        -   **Component**: `LogsViewer`.
        -   **Content**: A scrollable, auto-updating view of the router's logs.
        -   **Columns**: Time, Topics, Message.
    8.  **(Optional) Traffic Graphs**:
        -   **Component**: `TrafficGraph`.
        -   **Content**: A line chart (using Chart.js or similar) to visualize RX/TX traffic for a selected interface over time.

## 6. Security Considerations

1.  **Credential Encryption**: Router passwords in the `mikrotikrouters` collection **must** be encrypted at rest using a strong algorithm (e.g., AES-256-GCM). The encryption key must be stored securely as an environment variable, not in the codebase.
2.  **Restricted API User**: On each MikroTik router, create a dedicated API user group with limited permissions. Grant only the permissions necessary for the dashboard's functionality (`read`, `write`, `api`). Avoid using the `full` permission group.
3.  **Backend-Centric Architecture**: The frontend will **never** have direct access to the router's IP or credentials. All communication with the MikroTik router must be proxied through the backend API endpoints.
4.  **Transport Layer Security (TLS)**: All communication between the client browser and the backend server must be over HTTPS to prevent eavesdropping.
5.  **Input Validation**: The backend must validate and sanitize all input from the client (e.g., when creating a PPPoE user) to prevent command injection or other attacks.

## 7. Example JSON Payloads

**`GET /api/routers/:routerId/dashboard/status`**
```json
{
  "board-name": "hEX S",
  "version": "7.1.1",
  "cpu-load": "5",
  "uptime": "3d10h25m15s",
  "free-memory": "245112",
  "total-memory": "262144"
}
```

**`GET /api/routers/:routerId/dashboard/interfaces`**
```json
[
  {
    ".id": "*1",
    "name": "ether1",
    "type": "ether",
    "running": true,
    "rx-byte": "15234886",
    "tx-byte": "8972341"
  },
  {
    ".id": "*7",
    "name": "pppoe-out1",
    "type": "pppoe-out",
    "running": true,
    "rx-byte": "14000100",
    "tx-byte": "7500050"
  }
]
```

**`GET /api/routers/:routerId/dashboard/pppoe/active`**
```json
[
  {
    ".id": "*2A",
    "name": "user01",
    "service": "pppoe",
    "caller-id": "00:11:22:33:44:55",
    "address": "10.5.50.112",
    "uptime": "1h15m30s"
  },
  {
    ".id": "*2B",
    "name": "user02",
    "service": "pppoe",
    "caller-id": "AA:BB:CC:DD:EE:FF",
    "address": "10.5.50.115",
    "uptime": "45m10s"
  }
]
```

## 8. Future Enhancements

Once the core module is stable, it can be extended with the following features:

-   **Configuration Backup/Restore**: Add functionality to trigger and download router configuration backups.
-   **Health Monitoring & Alerting**: Integrate with a monitoring service to send alerts if a router goes offline or if CPU usage remains critically high.
-   **Script Management**: Create an interface to view and run pre-defined scripts on the router.
-   **Hotspot Management**: Add tabs for managing Hotspot users, profiles, and active connections.
-   **SNMP Integration**: Use SNMP for more granular and historical device monitoring.
-   **User-Level Bandwidth Reports**: Generate reports on bandwidth consumption for specific PPPoE users over a given period.
