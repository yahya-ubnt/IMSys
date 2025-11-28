# Specification: Multi-Tenancy Architecture Refactor

## 1. Introduction & Goal

**Goal:** To refactor the application's multi-tenancy architecture from a user-centric model to a dedicated, scalable `Tenant` model.

This refactor will establish a clear, robust, and professional foundation for the SaaS platform. It will improve data integrity, simplify future development, and align the architecture with industry best practices for multi-tenant applications.

This document outlines the "what," "how," and "why" of this refactoring process.

---

## 2. Core Concepts

To eliminate confusion, we will formally define the two central entities in our architecture:

*   **`Tenant`**: Represents a customer company (an ISP). This is the entity that the Super Admin bills and manages. It is the "account" that owns all associated data, such as routers, staff users, settings, and subscribers.
    *   *Example:* "LinkTek Inc."

*   **`User`**: Represents an individual person who can log in to the application. Every `User` must belong to a `Tenant`, with the exception of the `SUPER_ADMIN`. A `User` has roles and permissions that are granted *within* their `Tenant`.
    *   *Example:* `john@linktek.com`, `mary@linktek.com`.

---

## 3. Data Model Changes

This section details the required changes to the database schema.

### 3.1. New `Tenant` Model

A new model will be created to represent our customers.

**File:** `backend/models/Tenant.js`

```javascript
const mongoose = require('mongoose');

const TenantSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active',
  },
  // Future fields can be added here, e.g.:
  // address: { street: String, city: String, country: String },
  // billingInfo: { plan: String, stripeCustomerId: String },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Tenant', TenantSchema);
```

### 3.2. `User` Model Modification

The existing `User` model will be updated to link to the new `Tenant` model.

**File:** `backend/models/User.js`

**Current State:**
```javascript
// ...
roles: [{
  type: String,
  enum: ['SUPER_ADMIN', 'ADMIN_TENANT', 'USER'],
  required: true,
}],
tenantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
}
// ...
```

**New State:**
```javascript
// ...
roles: [{
  type: String,
  // Roles are now scoped to the tenant
  enum: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'SUPPORT'], 
  required: true,
}],
tenant: { // The 'tenantOwner' field is replaced by 'tenant'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant', // It now refers to the new Tenant model
    // Required for all users except SUPER_ADMIN
    required: function() { return !this.roles.includes('SUPER_ADMIN'); } 
}
// ...
```
*Note: The `ADMIN_TENANT` role will be simplified to `ADMIN`.*

### 3.3. All Other Data Models

**Rule:** Every model that currently has a `tenantOwner` field must be updated.

*   The `tenantOwner` field will be **renamed** to `tenant`.
*   The reference (`ref`) will be changed from `'User'` to `'Tenant'`.

*Example (`MikrotikRouter.js`):*
```javascript
// OLD:
tenantOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

// NEW:
tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }
```
This change will apply to over 30 models, ensuring all data is correctly and clearly owned by a `Tenant` entity.

---

## 4. API, Logic, and Access Control

This section defines the key workflows and security rules for the new architecture.

### 4.1. Super Admin Onboarding Workflow

The process for a `SUPER_ADMIN` to onboard a new customer will be as follows:

1.  **Create Tenant:** The Super Admin will access a "Tenant Management" dashboard. From there, they will create a new `Tenant` record, providing the company's name (e.g., "LinkTek Inc.") and setting their initial status.
2.  **Create Admin User:** After the `Tenant` entity is created, the Super Admin will create the first `User` for that tenant. This user will be assigned the `ADMIN` role and will be the primary administrator for that tenant account.

### 4.2. Data Isolation and Access Control

This is a critical rule for the entire platform.

*   **Strict Segregation:** The system will enforce strict data isolation. **No user, including the `SUPER_ADMIN`, will have a global view of all tenants' operational data** (e.g., a combined list of all routers or packages from all tenants).

*   **Querying Logic:** All API endpoints and services that access tenant-specific data **must** filter by the `tenant` ID of the currently authenticated user. There will be no special case in the filtering logic for the `SUPER_ADMIN`.

*   **`SUPER_ADMIN` Scope:** The Super Admin's permissions are limited to:
    *   Full CRUD operations on `Tenant` entities.
    *   Managing platform-wide settings and plans.
    *   Viewing aggregated, platform-wide analytics (e.g., "total number of active tenants").
    *   The Super Admin **cannot** access the operational dashboards or data of their tenants.

---

## 5. Data Migration Strategy

A one-time migration script must be created and executed to transition the existing data to the new schema without loss.

**Script Location:** `backend/scripts/migration-to-tenant-model.js`

**Execution Steps:**

1.  **Create Tenants:** The script will iterate through all `User` documents where `roles` includes `'ADMIN_TENANT'`. For each of these users, it will create a new `Tenant` document. The `name` of the new `Tenant` can be derived from the user's `fullName`.
2.  **Update User Links:** The script will then re-iterate through all `User` documents.
    *   For the old `ADMIN_TENANT` users, it will set their new `tenant` field to the ID of the `Tenant` created in Step 1. It will also update their role from `ADMIN_TENANT` to `ADMIN`.
    *   For standard users, it will find the new `Tenant` corresponding to their old `tenantOwner` and update their `tenant` field accordingly.
3.  **Update All Other Data:** The script will loop through every affected collection (e.g., `mikrotikrouters`, `packages`, `tickets`). For each document, it will find the new `Tenant` that corresponds to the old `tenantOwner` (`User`) ID and update the document to use the new `Tenant` ID in a new `tenant` field.

---

## 6. Phased Implementation Plan

This refactor will be executed in sequential phases to ensure a controlled and safe process.

*   **Phase 1: Model and Specification (Current Step)**
    *   Create the `iDocs/tenant-refactor-spec.md` file.
    *   Create the new `backend/models/Tenant.js` file.

*   **Phase 2: Data Migration Script**
    *   Write and thoroughly test the migration script described in Section 5. The script should be runnable multiple times without creating duplicate data.

*   **Phase 3: Core Logic Refactor**
    *   Update the `authMiddleware` to use the new `tenant` reference.
    *   Refactor the `superAdminController` to manage `Tenant` documents and implement the new onboarding workflow.
    *   Refactor the `userController` to correctly handle user creation within a `Tenant`.

*   **Phase 4: Full Codebase Refactor**
    *   Methodically update all other controllers, services, and routes to enforce the new strict data isolation rule for all roles, including the `SUPER_ADMIN`. This involves removing the `if (!req.user.roles.includes('SUPER_ADMIN'))` checks.

*   **Phase 5: Execution and Verification**
    *   Run the final migration script on the database.
    *   Thoroughly test the application, covering:
        *   Super Admin tenant management.
        *   Tenant Admin user management.
        *   Strict data isolation between tenants.
        *   The inability of the Super Admin to see tenant-specific data.

---

## 8. Frontend Refactoring Plan

This section outlines the necessary changes to the frontend codebase to align with the new multi-tenant backend architecture.

### Phase A: Update Core Authentication

**Goal:** Update the central authentication provider to understand the new `User` and `Tenant` data structure. This is the most critical phase and will resolve the `403 Forbidden` errors.

-   **File:** `frontend/src/components/auth-provider.tsx`
    -   **Task 1: Update User Interface.** Modify the `User` interface to include the new `tenant` field, which can be an object containing the tenant's ID and name.
    -   **Task 2: Update Login & Profile Fetching.** Modify the `login` and `checkAuth` functions to correctly process the `tenant` field from the API response and store it in the user state.
    -   **Task 3: Add Role-Based Helpers.** Add new helper functions to the `useAuth` hook for easily checking user roles (e.g., `isAdmin`, `isSuperAdmin`). This will centralize role-checking logic.

### Phase B: Update Data-Fetching Hooks & Contexts

**Goal:** Verify that data-fetching logic works correctly with the updated authentication context.

-   **File:** `frontend/src/context/NotificationContext.tsx`
    -   **Task:** Verify that API calls work correctly after the `AuthProvider` is fixed. No direct changes should be needed.
-   **File:** `frontend/src/hooks/use-settings.tsx`
    -   **Task:** Verify that API calls work correctly after the `AuthProvider` is fixed. No direct changes should be needed.
-   **File:** `frontend/src/app/mikrotik/routers/page.tsx`
    -   **Task:** Verify that the `fetchRouters` call works correctly. The component should function properly after the `AuthProvider` is fixed.

### Phase C: Rework Super Admin UI

**Goal:** Rework the Super Admin's tenant management page to match the new backend API for creating and managing `Tenant` objects instead of `User` objects.

-   **File:** `frontend/src/app/superadmin/tenants/page.tsx`
    -   **Task 1: Update Data Fetching.** Change the `fetch` call from `/api/super-admin/tenants` to the new `/api/tenants` endpoint.
    -   **Task 2: Rework "Create Tenant" Form.** Implement the new two-step workflow. The form will now submit to `POST /api/tenants` with the `tenantName` and the new admin user's details (`fullName`, `email`, etc.).
    -   **Task 3: Update Tenant List.** The component that displays the list of tenants must be updated to render `Tenant` objects from the new API instead of `User` objects.
