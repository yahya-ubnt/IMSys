# Mikrotik Hotspot Integration Specification

## 1. Objective

To extend the ISP Management System by integrating with Mikrotik routers to manage Hotspot services. This will enable the creation and management of hotspot plans, automated user provisioning, and control over user access based on defined plans. This integration will work within the existing multi-tenant architecture.

## 2. Core Features

### 2.1. Hotspot Plan Management

Administrators will be able to create, read, update, and delete Hotspot service plans. These plans will define the terms of access for hotspot users, such as duration, speed, and data limits.

#### 2.1.1. Hotspot Plan Fields

- **`name`**: 
  - **Type**: String
  - **Description**: A descriptive name for the hotspot plan (e.g., "Daily Pass", "Weekly Pro").
  - **Validation**: Required, unique.

- **`price`**:
  - **Type**: Number
  - **Description**: The price of the hotspot plan.
  - **Validation**: Required, positive number.

- **`timeLimitValue`**:
  - **Type**: Number
  - **Description**: The numerical value of the plan's duration.
  - **Validation**: Required, positive integer.

- **`timeLimitUnit`**:
  - **Type**: Enum
  - **Description**: The unit for the `timeLimitValue`.
  - **Options**: `minutes`, `hours`, `days`, `weeks`, `months`, `year`.
  - **Validation**: Required.

- **`server`**:
  - **Type**: String
  - **Description**: The name of the Mikrotik IP Hotspot server this plan applies to.
  - **Implementation**: This will be a dropdown populated from the selected Mikrotik router via the API (`/ip hotspot server find`).

- **`profile`**:
  - **Type**: String
  - **Description**: The user profile within the Mikrotik Hotspot that this plan will use.
  - **Implementation**: This will be a dropdown populated from the selected Mikrotik router via the API (`/ip hotspot user profile find`).

- **`rateLimit`**:
  - **Type**: String
  - **Description**: The download and upload speed limit for the user (e.g., "1M/5M"). This will be applied to the user's profile.

- **`dataLimitValue`**:
  - **Type**: Number
  - **Description**: The numerical value for the data limit. A value of `0` signifies an unlimited data allowance.
  - **Default**: `0`.

- **`dataLimitUnit`**:
  - **Type**: Enum
  - **Description**: The unit for the `dataLimitValue`.
  - **Options**: `MB`, `GB`.

- **`sharedUsers`**:
  - **Type**: Number
  - **Description**: The number of simultaneous devices that can use a single voucher or user account.
  - **Validation**: Required, positive integer.

- **`validDays`**:
  - **Type**: Array of Strings
  - **Description**: The specific days of the week when the plan is valid and usable.
  - **Implementation**: A series of checkboxes for each day from Monday to Sunday.

- **`showInCaptivePortal`**:
  - **Type**: Boolean
  - **Description**: A toggle to control whether this plan is visible to end-users on the captive portal login page.
  - **Default**: `true`.

### 2.2. Hotspot User Management (Recurring Users)

This feature allows for the creation and management of recurring hotspot users who are billed on a cyclical basis. These users are created in the Mikrotik router under `/ip hotspot user`.

#### 2.2.1. Hotspot User Fields

- **`officialName`**: String (Required)
- **`email`**: String (Optional, for notifications)
- **`location`**: String (Optional)
- **`hotspotName`**: String (Required, the username for the hotspot login)
- **`hotspotPassword`**: String (Required, the password for the hotspot login)
- **`package`**: ObjectId (ref: `HotspotPlan`, Required, Dropdown)
- **`server`**: String (Required, Dropdown from `/ip hotspot server`)
- **`profile`**: String (Required, Dropdown from `/ip hotspot user profile`)
- **`referenceNumber`**: String (Required, Unique client account number for billing)
- **`billAmount`**: Number (Required, The amount for the recurring bill)
- **`installationFee`**: Number (Optional, a one-time fee)
- **`billingCycleValue`**: Number (Required)
- **`billingCycleUnit`**: Enum (`days`, `weeks`, `months`, `year`, Required)
- **`phoneNumber`**: String (Required)
- **`expiryDate`**: Date (Required)
- **`expiryTime`**: Time (Required)

## 3. Proposed Technical Implementation

### 3.1. Database Schema

A new `HotspotPlan` model will be created.

```javascript
// backend/models/HotspotPlan.js

const mongoose = require('mongoose');

const hotspotPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the ADMIN_TENANT user
    required: true,
  },
  mikrotikRouter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MikrotikRouter',
    required: true,
  },
  timeLimitValue: {
    type: Number,
    required: true,
  },
  timeLimitUnit: {
    type: String,
    enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'year'],
    required: true,
  },
  server: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
    required: true,
  },
  rateLimit: {
    type: String,
  },
  dataLimitValue: {
    type: Number,
    default: 0,
  },
  dataLimitUnit: {
    type: String,
    enum: ['MB', 'GB'],
  },
  sharedUsers: {
    type: Number,
    required: true,
    default: 1,
  },
  validDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  showInCaptivePortal: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

const HotspotPlan = mongoose.model('HotspotPlan', hotspotPlanSchema);

module.exports = HotspotPlan;
```

A new `HotspotUser` model will be created to store recurring user data.

```javascript
// backend/models/HotspotUser.js

const mongoose = require('mongoose');

const hotspotUserSchema = new mongoose.Schema({
  officialName: { type: String, required: true },
  email: { type: String },
  location: { type: String },
  hotspotName: { type: String, required: true, unique: true },
  hotspotPassword: { type: String, required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'HotspotPlan', required: true },
  server: { type: String, required: true },
  profile: { type: String, required: true },
  referenceNumber: { type: String, required: true, unique: true },
  billAmount: { type: Number, required: true },
  installationFee: { type: Number, default: 0 },
  billingCycleValue: { type: Number, required: true },
  billingCycleUnit: { type: String, enum: ['days', 'weeks', 'months', 'year'], required: true },
  phoneNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  expiryTime: { type: String, required: true }, // Storing time as a string e.g., "23:59"
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mikrotikRouter: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikRouter', required: true },
}, {
  timestamps: true,
});

const HotspotUser = mongoose.model('HotspotUser', hotspotUserSchema);

module.exports = HotspotUser;
```

### 3.2. Backend (Node.js/Express)

- **New Models:** `backend/models/HotspotPlan.js`, `backend/models/HotspotUser.js`
- **New Controllers:** `backend/controllers/hotspotPlanController.js`, `backend/controllers/hotspotUserController.js`
- **New Routes:** `backend/routes/hotspotPlanRoutes.js`, `backend/routes/hotspotUserRoutes.js`

**API Endpoints:**

- `POST /api/hotspot/plans`: Create a new hotspot plan.
- `GET /api/hotspot/plans`: Get all hotspot plans for the logged-in tenant.
- `GET /api/hotspot/plans/:id`: Get a single hotspot plan by its ID.
- `PUT /api/hotspot/plans/:id`: Update a hotspot plan.
- `DELETE /api/hotspot/plans/:id`: Delete a hotspot plan.

- `POST /api/hotspot/users`: Create a new recurring hotspot user.
- `GET /api/hotspot/users`: Get all recurring hotspot users for the tenant.
- `GET /api/hotspot/users/:id`: Get a single recurring hotspot user.
- `PUT /api/hotspot/users/:id`: Update a recurring hotspot user.
- `DELETE /api/hotspot/users/:id`: Delete a recurring hotspot user.

- `GET /api/mikrotik/routers/:id/hotspot-servers`: Fetch the list of Hotspot servers from a specific router.
- `GET /api/mikrotik/routers/:id/hotspot-profiles`: Fetch the list of Hotspot user profiles from a specific router.

### 3.3. Frontend (Next.js/React)

- **New Page:** A new page will be created under `/hotspot/plans` to list, create, and edit hotspot plans.
- **New Components:**
  - `HotspotPlanList.tsx`: A table to display all existing hotspot plans with options to edit or delete.
  - `HotspotPlanForm.tsx`: A form (used for both creating and editing) with fields as described in section 2.1.1. This form will dynamically populate the 'Server' and 'Profile' dropdowns based on the selected Mikrotik router.

- **New Page:** A new page will be created under `/hotspot/users` to manage recurring users.
- **New Components:**
  - `HotspotUserList.tsx`: Table for listing recurring hotspot users.
  - `HotspotUserForm.tsx`: Form for creating and editing recurring hotspot users.
