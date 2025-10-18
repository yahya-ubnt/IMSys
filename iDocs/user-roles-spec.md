# User Roles and Permissions Specification

## 1. Introduction

This document outlines a new Role-Based Access Control (RBAC) system to replace the current `isAdmin` boolean flag. This change is necessary to support a multi-tenant SaaS architecture where multiple ISPs (tenants) can manage their own resources independently.

The new system will introduce a `roles` array to the `User` model, allowing for more granular and flexible permission management.

## 2. Roles & Permissions

The following roles will be implemented:

### 2.1. SUPER_ADMIN

*   **Description**: The owner and administrator of the entire SaaS platform.
*   **Permissions**:
    *   Full CRUD (Create, Read, Update, Delete) access to all data across all tenants.
    *   Can manage tenant accounts (create, suspend, delete `ADMIN_TENANT` users).
    *   Can access platform-wide settings and analytics.

### 2.2. ADMIN_TENANT

*   **Description**: The primary user for an ISP customer. This user is the administrator for their own tenancy.
*   **Permissions**:
    *   Full CRUD access to all resources belonging to their own tenant account (e.g., their Mikrotik routers, their Mikrotik users, their payment records, their settings).
    *   Can create, manage, and delete `STANDARD_USER` accounts within their own tenancy.
    *   Cannot access or view data from any other tenant.

### 2.3. STANDARD_USER

*   **Description**: A staff member of an ISP. This user has limited permissions within their tenancy.
*   **Permissions (Initial Implementation)**:
    *   Read-only access to most resources within their tenancy (e.g., view Mikrotik users, routers, payments).
    *   Cannot create, update, or delete major resources.
    *   Cannot manage other users.
*   **Future Extensibility**: This role can be expanded in the future to have more granular permissions (e.g., a "Technician" role that can manage routers, or a "Support" role that can manage tickets).

## 3. Data Model Changes

### 3.1. `User` Model (`backend/models/User.js`)

The `User` model will be modified as follows:

*   The `isAdmin` boolean field will be **removed**.
*   A new `roles` field will be added:
    *   **Type**: `[String]`
    *   **Enum**: `['SUPER_ADMIN', 'ADMIN_TENANT', 'STANDARD_USER']`
    *   **Required**: `true`
*   A new `tenantOwner` field will be added to link users to their tenancy:
    *   **Type**: `mongoose.Schema.Types.ObjectId`
    *   **Ref**: `'User'`
    *   **Description**: For `ADMIN_TENANT` and `STANDARD_USER`s, this field will point to the `_id` of the `ADMIN_TENANT` user who owns the account. For a `SUPER_ADMIN`, this can be null.

## 4. API Endpoint Protection

The authentication and authorization middleware (`backend/middlewares/authMiddleware.js`) will be refactored:

*   The `protect` middleware will be updated to attach the user's roles and `tenantOwner` to the `req` object.
*   The `admin` middleware will be replaced with more specific middleware functions:
    *   `isSuperAdmin`: Checks if the user has the `SUPER_ADMIN` role.
    *   `isAdminTenant`: Checks if the user has the `ADMIN_TENANT` role.
    *   `isStandardUser`: Checks if the user has the `STANDARD_USER` role.
*   All API routes will be updated to use the appropriate middleware to enforce the permissions outlined in section 2. For example, creating a new router will require the `isAdminTenant` role.

## 5. User Management Flow

1.  **Super Admin Creates Tenant**: The `SUPER_ADMIN` will have an interface (or API endpoint) to create a new `ADMIN_TENANT` user. This will be the primary account for a new ISP customer.
2.  **Admin Tenant Manages Staff**: The `ADMIN_TENANT` can log in and create new `STANDARD_USER` accounts for their staff. When they create a new user, the `tenantOwner` for that new user will be automatically set to the `_id` of the `ADMIN_TENANT`.
3.  **Data Isolation**: All database queries will be modified to include a `where({ tenantOwner: req.user.tenantOwner })` clause, ensuring that users can only access data within their own tenancy.
