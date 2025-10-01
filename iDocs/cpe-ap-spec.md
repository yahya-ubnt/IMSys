# CPE & Access Point Monitoring Module Specification

## 1. Overview

This document outlines the specifications for a CPE (Customer Premises Equipment) and AP (Access Point) monitoring module integrated within the main billing system. The module leverages the MikroTik API to monitor the status of network devices, track their downtime, and provide alerts and reports.

---

## 2. Device Registration

All monitored devices must be registered in the billing system. The registration form will capture device-specific details and management credentials.

### 2.1. Device Types

There are two primary types of devices that can be registered:
- **Access Point (AP):** A device that broadcasts a wireless signal for clients to connect to (e.g., a base station).
- **Station:** A client device that connects to an Access Point (e.g., a CPE).

### 2.2. Common Device Fields

These fields are mandatory for both **Access Point** and **Station** device types.

| Field Name      | Type                      | Input Method      | Description                                                                 |
|-----------------|---------------------------|-------------------|-----------------------------------------------------------------------------|
| `device_id`     | `UUID`                    | Auto-generated    | Primary key for the device entry.                                           |
| `router_id`     | `ForeignKey`              | Drop-down Select  | The MikroTik router through which this device will be monitored.            |
| `ip_address`    | `String`                  | Manual Input      | The management IP address of the device. Must be reachable from the router. |
| `mac_address`   | `String`                  | Manual Input      | The unique MAC address of the device.                                       |
| `device_type`   | `Enum("Access", "Station")` | Drop-down Select  | The type of the device.                                                     |
| `location`      | `String`                  | Manual Input      | Textual description of the device's physical location.                     |
| `status`        | `Enum("UP", "DOWN")`      | **System-managed**| The current operational status of the device. Not user-editable.            |
| `last_seen`     | `Timestamp`               | **System-managed**| The timestamp of the last successful ping response. Not user-editable.      |

### 2.3. Station-Specific Fields

These fields are required only when `device_type` is **Station**.

| Field Name          | Type       | Input Method | Description                                           |
|---------------------|------------|--------------|-------------------------------------------------------|
| `device_name`       | `String`   | Manual Input | A friendly, recognizable name for the device.         |
| `device_model`      | `String`   | Manual Input | The model of the device (e.g., "NanoStation M5").     |
| `login_username`    | `String`   | Manual Input | The username for accessing the device's management UI. |
| `login_password`    | `String`   | Manual Input | The password for the device's management UI.         |
| `ssid`              | `String`   | Manual Input | The SSID of the Access Point this station connects to.|
| `wireless_password` | `String`   | Manual Input | The pre-shared key for connecting to the AP.          |

### 2.4. Access Point-Specific Fields

These fields are required only when `device_type` is **Access Point**.

| Field Name          | Type       | Input Method | Description                                           |
|---------------------|------------|--------------|-------------------------------------------------------|
| `device_name`       | `String`   | Manual Input | A friendly, recognizable name for the device.         |
| `device_model`      | `String`   | Manual Input | The model of the device (e.g., "LiteBeam AC AP").     |
| `login_username`    | `String`   | Manual Input | The username for accessing the device's management UI. |
| `login_password`    | `String`   | Manual Input | The password for the device's management UI.         |
| `ssid`              | `String`   | Manual Input | The SSID that this Access Point broadcasts.           |
| `wireless_password` | `String`   | Manual Input | The WPA2 key used by clients to connect to this AP.   |

---

## 3. Monitoring

The monitoring process is actively managed by the billing system, which uses the selected MikroTik router as a proxy to check device health.

### 3.1. Mechanism

- The billing system's backend will contain a monitoring service.
- This service will iterate through all registered devices and ping their `ip_address` via the MikroTik API associated with their `router_id`.
- The ping interval will be configurable, with a default of **5 seconds**.

### 3.2. Status Handling Logic

- **Ping Success:**
  - If the device `status` was previously `DOWN`, change it to `UP`.
  - If a downtime log is open for this device, close it by setting `down_end_time` and calculating the `duration_seconds`.
  - Trigger a "Device UP" alert (optional).
  - Update the `last_seen` timestamp to the current time.

- **Ping Failure:**
  - If the device `status` was previously `UP`, change it to `DOWN`.
  - Create a new entry in the `downtime_logs` table, setting the `device_id` and `down_start_time`.
  - Trigger a "Device DOWN" alert.
  - The `last_seen` timestamp is not updated.

---

## 4. Database Schema

Two tables are required to support this module.

### 4.1. `devices` Table

This table will store all registered CPEs and APs.

```sql
CREATE TABLE devices (
    device_id VARCHAR(36) PRIMARY KEY,
    router_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17) NOT NULL UNIQUE,
    device_type ENUM('Access', 'Station') NOT NULL,
    status ENUM('UP', 'DOWN') NOT NULL DEFAULT 'DOWN',
    last_seen TIMESTAMP NULL,
    location TEXT,
    device_name VARCHAR(255),
    device_model VARCHAR(255),
    login_username VARCHAR(255),
    login_password VARCHAR(255), -- Encrypted
    ssid VARCHAR(255),
    wireless_password VARCHAR(255), -- Encrypted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (router_id) REFERENCES mikrotik_routers(router_id)
);
```

### 4.2. `downtime_logs` Table

This table will store a historical record of all downtime events for each device.

```sql
CREATE TABLE downtime_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(36) NOT NULL,
    down_start_time TIMESTAMP NOT NULL,
    down_end_time TIMESTAMP NULL,
    duration_seconds INT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);
```

---

## 5. Alerting

The system will generate alerts to notify administrators of device status changes.

- **Device DOWN Alert:** Triggered immediately when a device transitions from `UP` to `DOWN`.
- **Device UP Alert:** Triggered when a device transitions from `DOWN` to `UP`. This can be enabled or disabled globally.

Alerts can be dispatched via multiple channels:
- Email
- SMS
- WhatsApp

---

## 6. Frontend Implementation Details

This section outlines the frontend components and pages required for the CPE & AP Monitoring module. The implementation should reuse existing components and styles to ensure a consistent user experience.

### 6.1. File Structure

New files will be added to the `frontend/src` directory:

```
frontend/src/
├───app/
│   └───devices/                  # New directory for the module
│       ├───page.tsx              # View All Devices page
│       ├───new/                  # Add New Device page
│       │   └───page.tsx
│       ├───[id]/                 # View Device Details page
│       │   └───page.tsx
│       └───edit/
│           └───[id]/             # Edit Device page
│               └───page.tsx
└───lib/
    └───deviceService.ts          # Service for API interactions
```

### 6.2. API Service (`lib/deviceService.ts`)

This service will centralize all API communication for the module.

- **`getDevices(token)`**: Fetches all devices from `GET /api/devices`.
- **`getDeviceById(id, token)`**: Fetches a single device from `GET /api/devices/:id`.
- **`createDevice(deviceData, token)`**: Creates a new device via `POST /api/devices`.
- **`updateDevice(id, deviceData, token)`**: Updates a device via `PUT /api/devices/:id`.
- **`deleteDevice(id, token)`**: Deletes a device via `DELETE /api/devices/:id`.
- **`getDeviceDowntimeLogs(id, token)`**: Fetches downtime history from `GET /api/devices/:id/downtime`.

### 6.3. "View All Devices" Page (`app/devices/page.tsx`)

This page will serve as the main dashboard for the module.

- **Layout**: Follows the existing pattern with a main title, a link to the "Add New Device" page, and content organized in `Card` components.
- **Header**: Displays "Device Management" as the main title and an "Add New Device" button with a `PlusCircledIcon`.
- **Summary Cards**: Three `Card` components at the top will display key stats:
    - **Total Devices**: A count of all registered devices.
    - **Devices UP**: A count of all devices with `status: 'UP'`. Styled with a green accent color.
    - **Devices DOWN**: A count of all devices with `status: 'DOWN'`. Styled with a red accent color.
- **Data Table**: A `DataTable` component will list all devices with the following columns:
    - `Device Name`
    - `IP Address`
    - `MAC Address`
    - `Type` (Access / Station)
    - `Status`: A badge component with color-coding (Green for UP, Red for DOWN).
    - `Router`: The name of the associated MikroTik router.
    - `Last Seen`: A formatted timestamp.
    - `Actions`: A dropdown menu with "Edit" and "Delete" options.
- **Functionality**:
    - Table rows will be clickable, navigating to the corresponding `devices/[id]` page.
    - A search input will filter the table by device name, IP, or MAC address.

### 6.4. "Add / Edit Device" Form (`app/devices/new/page.tsx`, `app/devices/edit/[id]/page.tsx`)

This form will be used for both creating and updating devices. The `edit` page will reuse the same component as the `new` page, but will first fetch the device data to pre-populate the form fields.

- **Step 1: Initial Selection (Create Mode Only)**
    - On the `new` page, the user is presented with a `Card` containing only two required fields:
        - **MikroTik Router**: A `Select` dropdown populated from `/api/mikrotik/routers`.
        - **Device Type**: A `Select` dropdown with options "Access" and "Station".
    - The rest of the form will not be visible until both of these fields have a valid selection.
    - In `edit` mode, these fields will be pre-filled and visible along with the rest of the form from the start.

- **Step 2: Main Form**
    - **Layout**: A multi-section form using `Card` components for grouping.
    - **Form Sections**:
        1.  **Core Details** (`Card`):
            - `Device Name`: `Input` component.
            - `Device Model`: `Input` component (e.g., "NanoStation M5").
            - `Location`: `Input` component for a textual description of the location.
        2.  **Network & Management** (`Card`):
            - `IP Address`: `Input` component.
            - `MAC Address`: `Input` component.
            - `Login Username`: `Input` component.
            - `Login Password`: `Input` component with `type="password"`.
        3.  **Wireless Details** (`Card` - Conditionally Rendered based on `Device Type`):
            - **If `Device Type` is "Access"**: Show `SSID` (label: "Broadcasted SSID") and `Wireless Password` (label: "WPA2 Key").
            - **If `Device Type` is "Station"**: Show `SSID` (label: "AP to Connect To") and `Wireless Password` (label: "Pre-shared Key").
- **Actions**: "Save Device" and "Cancel" buttons at the bottom.

### 6.5. "Device Details" Page (`app/devices/[id]/page.tsx`)

This page will provide a comprehensive, read-only view of a single device and its history, consistent with the Mikrotik User Details page.

- **Header**: Will display the `deviceName` and include two buttons: a "Back" button and an "Edit" button that links to the `devices/edit/[id]` page.
- **Layout**: A series of `Card` components.
- **Device Information Card**: A `Card` titled "Device Information" will display all fields from the device object. Each field will be displayed using a reusable `DetailItem` component (Icon, Label, Value).
- **Downtime History Card**: A separate `Card` titled "Downtime History" will contain a `DataTable`.
    - This table will be populated by fetching data from the `/api/devices/:id/downtime` endpoint.
    - Columns: `Start Time`, `End Time`, `Duration`.

---

## 7. Backend Implementation Details

This section describes the required backend components, logic, and structure.

### 7.1. Project Structure Additions

New files will be added to the `backend` directory:

```
backend/
├───controllers/
│   └───deviceController.js         # Controller for device CRUD
├───models/
│   ├───Device.js                   # Mongoose model for devices
│   └───DowntimeLog.js              # Mongoose model for downtime logs
├───routes/
│   └───deviceRoutes.js             # Routes for /api/devices
└───services/
    ├───monitoringService.js        # Core logic for pinging and status updates
    └───alertingService.js          # Service for sending notifications
```

### 7.2. API Endpoints

The following RESTful endpoints will be created under the `/api/devices` path. All routes must be protected by the `protect` and `admin` auth middleware.

| Method | Endpoint                  | Controller Function     | Description                               |
|--------|---------------------------|-------------------------|-------------------------------------------|
| `POST` | `/`                       | `createDevice`          | Register a new device.                    |
| `GET`  | `/`                       | `getDevices`            | Retrieve a list of all registered devices.|
| `GET`  | `/:id`                    | `getDeviceById`         | Get details for a single device.          |
| `PUT`  | `/:id`                    | `updateDevice`          | Update an existing device's details.     |
| `DELETE`| `/:id`                    | `deleteDevice`          | Remove a device from the system.          |
| `GET`  | `/:id/downtime`           | `getDeviceDowntimeLogs` | Get all downtime history for a device.    |

### 7.3. Controller Logic (`deviceController.js`)

- **`createDevice(req, res)`**:
  - Validates request body (`ip_address`, `mac_address`, `router_id`, etc.).
  - Encrypts `login_password` and `wireless_password` using the `crypto` utility.
  - Creates a new `Device` document and saves it to the database.
  - Returns the newly created device object.

- **`getDevices(req, res)`**:
  - Fetches all devices from the database.
  - Supports pagination (`?page=1&limit=20`).
  - Returns a list of devices.

- **`getDeviceById(req, res)`**:
  - Finds a device by its `device_id`.
  - Populates the associated `router_id` details.
  - Returns the device object.

- **`updateDevice(req, res)`**:
  - Finds device by `device_id`.
  - Validates incoming data.
  - If `login_password` or `wireless_password` are being updated, it encrypts them before saving.
  - Updates the document and returns the updated object.

- **`deleteDevice(req, res)`**:
  - Finds device by `device_id` and removes it.
  - Also deletes all associated `DowntimeLog` entries to maintain data integrity.
  - Returns a success message.

- **`getDeviceDowntimeLogs(req, res)`**:
  - Finds all `DowntimeLog` documents associated with the `device_id`.
  - Sorts the logs by `down_start_time` in descending order.
  - Returns the list of downtime logs.

### 7.4. Monitoring Service (`monitoringService.js`)

This service runs as a background process, started by `server.js`. It should not block the main event loop.

- **`startMonitoring()`**:
  - Initializes the service.
  - Uses a scheduler (e.g., `setInterval` or `node-cron`) to call `checkAllDevices()` every 5 seconds.

- **`checkAllDevices()`**:
  - Fetches all devices from the `Device` model.
  - Iterates through the list of devices in parallel (e.g., using `Promise.allSettled`).
  - For each device, it calls `pingDevice(device)`.

- **`pingDevice(device)`**:
  - Retrieves the full router object (including decrypted credentials) using `device.router_id`.
  - Uses a MikroTik API client library (e.g., `node-mikrotik`) to connect to the router.
  - Executes a ping command: `/ping address=${device.ip_address} count=1`.
  - **On Success (ping response received):** Calls `handleSuccessfulPing(device)`.
  - **On Failure (timeout or error):** Calls `handleFailedPing(device)`.

- **`handleSuccessfulPing(device)`**:
  - If `device.status` is 'DOWN':
    - Finds the latest open `DowntimeLog` for the device.
    - Sets `down_end_time` to the current timestamp.
    - Calculates `duration_seconds`.
    - Saves the updated log.
    - Calls `alertingService.sendAlert(device, 'UP')`.
  - Updates the device in the database: `status: 'UP'`, `last_seen: new Date()`.

- **`handleFailedPing(device)`**:
  - If `device.status` is 'UP':
    - Creates a new `DowntimeLog` with `device_id` and `down_start_time`.
    - Calls `alertingService.sendAlert(device, 'DOWN')`.
    - Updates the device in the database: `status: 'DOWN'`.

### 7.5. Alerting Service (`alertingService.js`)

- **`sendAlert(device, status)`**:
  - Constructs a message, e.g., `Device ${device.name} (${device.ip_address}) is now ${status}.`
  - Checks system settings to determine which notification channels are active.
  - Dispatches the message using the relevant services (`smsService`, `whatsappService`, etc.).

### 7.6. Security Considerations

- **Password Encryption**: All device credentials (`login_password`, `wireless_password`) and router passwords MUST be encrypted at rest using the existing `utils/crypto.js` utility.
- **API Security**: All API endpoints must be protected by the `authMiddleware` to ensure only authenticated and authorized users can manage devices.
- **MikroTik Credentials**: Router credentials should be stored encrypted and only decrypted in memory by the `monitoringService` when needed.