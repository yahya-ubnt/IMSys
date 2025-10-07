# Mikrotik Integration Specification

## 1. Objective

Integrate the ISP Management System with Mikrotik routers to automate user provisioning and lifecycle management. This will streamline the process of adding new clients and ensure that network access is automatically managed based on the client's billing status.

## 2. Core Features

### 2.1. Mikrotik Router Management
- **Add/Edit/Delete Mikrotik Routers:** The system administrator should be able to securely store and manage the connection details for one or more Mikrotik routers.
  - **Fields:**
    - `name`: String - A friendly name to identify the router.
    - `ipAddress`: String - The IP address of the Mikrotik router.
    - `apiUsername`: String - The username for the Mikrotik API.
    - `apiPassword`: String - The password for the Mikrotik API.
    - `apiPort`: Number - The port for the Mikrotik API service (e.g., 8728).
    - `location`: String - The physical location of the router.
  - **Security:** Router credentials must be encrypted at rest.
- **Connection Status:** The system should be able to test the API connection to a configured router.

### 2.2. Package Management
- **Add/Edit/Delete Service Packages:** Admins can define service packages that are linked to a specific Mikrotik router and service type.
- **Creation Workflow:**
  1. Select the **Mikrotik Router** the package will belong to.
  2. Select the **Service Type** (PPPoE or Static IP).
  3. Fill in the package details.
- **PPPoE Package Fields:**
  - `name`: String (Required, e.g., "Gold Plan")
  - `profile`: String (Required, The name of the profile in the Mikrotik router)
  - `price`: Number (Required, The monthly price for the package)
  - `status`: Enum['active', 'disabled'] (Required)
- **Static IP Package Fields:**
  - `name`: String (Required, e.g., "Business Static")
  - `rateLimit`: String (Required, e.g., "10M/10M". This will be used to create a Simple Queue in Mikrotik for the user.)
  - `price`: Number (Required)
  - `status`: Enum['active', 'disabled'] (Required)

### 2.3. Client Provisioning
- **ISP User Creation:** When creating a new ISP user, the admin will provide the following:
  - **Connection Information:**
    - `username`: String (Required. This will be the username for the PPPoE secret created on the Mikrotik router.)
    - `officialName`: String (Required)
    - `emailAddress`: String (Optional)
    - `pppoePassword`: String (Required only for PPPoE service type. This will be the password for the PPPoE secret. The admin can input it manually or use a generator button to create a random 6-digit or 6-letter password.)
  - **Package Selection:**
    - Select a **Package** from a dropdown list. The list will be filtered based on the selected Mikrotik router and service type. This selection will determine the user's service level and their monthly bill.
  - **Personal & Billing Information:**
    - `mPesaRefNo`: String (Required. This is the client's unique account number for billing. It can be input manually or generated automatically by the system as a unique 6-digit number.)
    - `installationFee`: Number (Optional)
    - `billingCycle`: String (Required)
    - `mobileNumber`: String (Required)
    - `expiryDate`: Date (Required. Will default to the current date during creation.)
- **Automatic Provisioning:** Upon creating the user, the system will connect to the selected Mikrotik router and create the corresponding user. For PPPoE, this means creating a PPPoE secret. For Static IP, this means creating a Simple Queue with the rate limit defined in the user's selected package.

### 2.4. Automated Lifecycle Management
- **Suspension/Disconnection:** When a user's `expiryDate` is reached, a scheduled job (`disconnectExpiredClients.js`) will run daily. This script will connect to the Mikrotik router to perform the following actions for expired clients:
    1.  **Terminate Active Session:** Immediately remove any active PPPoE session for the client.
    2.  **Disable User Account:** Mark the client's PPPoE secret as disabled to prevent future connections.
    3.  **Assign "Disconnect" Profile:** Change the client's PPPoE secret profile to a pre-defined "disconnect" profile (e.g., with a very low rate limit) for clear status indication and as a fallback.
- **Re-activation:** When a payment is registered (e.g., a new bill is created or an existing one is marked as paid), the system will re-enable the user's account on the Mikrotik router and revert their profile to their original service package profile.

### 3.4. Expired Client Disconnection Script (`disconnectExpiredClients.js`)

**Purpose:** To automate the disconnection and prevention of access for PPPoE clients whose service expiry date has passed.

**Location:** `backend/scripts/disconnectExpiredClients.js`

**Trigger:** Executed daily via a `cron` job (on the server hosting the backend) shortly after midnight (e.g., 00:01 AM).

**Logic:**
1.  **Identify Expired Clients:**
    *   Queries all active PPPoE secrets from configured MikroTik routers.
    *   Filters secrets where `disabled=no` and `expiry-date` is set and is less than or equal to the current date.
2.  **Process Each Expired Client:** For each identified client:
    *   **Terminate Active Session:** Executes `/ppp active remove [find user="<username>"]`.
    *   **Disable User Account:** Executes `/ppp secret set [find name="<username>"] disabled=yes`.
    *   **Assign "Disconnect" Profile:** Executes `/ppp secret set [find name="<username>"] profile="disconnect"`.
3.  **Error Handling & Logging:**
    *   Implements robust error handling for MikroTik API calls.
    *   Logs successful disconnections and any errors encountered to a designated log file.

## 3. Proposed Technical Implementation

### 3.1. Database Schema
- **`MikrotikRouter` Model:**
  - `name`: String
  - `ipAddress`: String
  - `apiUsername`: String
  - `apiPassword`: String (encrypted)
  - `apiPort`: Number
  - `location`: String
- **`Package` Model:**
  - `mikrotikRouter`: ObjectId (ref: `MikrotikRouter`, required)
  - `serviceType`: Enum['pppoe', 'static'] (required)
  - `name`: String (required)
  - `price`: Number (required)
  - `status`: Enum['active', 'disabled'] (required)
  - `profile`: String (for PPPoE)
  - `rateLimit`: String (for Static IP)
- **`ISPUser` Model (Additions):**
  // Connection & Service Details
  - `mikrotikRouter`: ObjectId (ref: `MikrotikRouter`, required)
  - `serviceType`: Enum['pppoe', 'static'] (required)
  - `package`: ObjectId (ref: `Package`, required)
  - `username`: String (required)
  - `pppoePassword`: String (for PPPoE)
  - `remoteAddress`: String (for PPPoE)

  // Personal & Billing Information
  - `officialName`: String (required)
  - `emailAddress`: String
  - `mPesaRefNo`: String (required)
  - `installationFee`: Number
  - `billingCycle`: String (required)
  - `mobileNumber`: String (required)
  - `expiryDate`: Date (required)

  // System-managed fields
  - `isSuspended`: Boolean (default: false)

### 3.2. Backend (Node.js/Express)
- **New Routes:**
  - `/api/mikrotik/routers`: Full CRUD for Mikrotik Routers.
  - `/api/mikrotik/routers/:id/ppp-profiles`: GET request to fetch the list of PPP profiles from a specific router.
  - `/api/mikrotik/routers/:id/ppp-services`: GET request to fetch the list of PPP services from a specific router.
  - `/api/mikrotik/packages`: Full CRUD for Packages.
  - `/api/mikrotik/test-connection`: Test API connectivity to a router.
- **Mikrotik API Client:** A new service/library will be needed to handle communication with the Mikrotik RouterOS API (e.g., `node-routeros`).
- **Controller Logic:**
  - `mikrotikUserController`: `createMikrotikUser` and `updateMikrotikUser` will be modified to trigger provisioning.
  - `billController`: A scheduled job will check for expired bills and trigger suspension/disconnection.

### 3.3. Frontend (Next.js/React)
- **New Pages/Components:**
  - `/settings/mikrotik/routers`: Manage Mikrotik routers.
  - `/settings/mikrotik/packages`: Manage service packages.
  - `MikrotikUserForm.tsx` (Modification): The user creation form will be updated to include the new package selection workflow. Next to the package dropdown, a button will allow for creating a new package on-the-fly in a modal window.
  - User Details Page: Display the user's package and provisioning status.
