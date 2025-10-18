# Super Admin Functionality Specification

## 1. Introduction

This document outlines the features and functionality exclusive to the `SUPER_ADMIN` role. The `SUPER_ADMIN` is the owner of the SaaS platform and has global oversight and administrative control over all tenants and system-wide settings.

## 2. SUPER_ADMIN Dashboard

Upon logging in, the `SUPER_ADMIN` will be presented with a dashboard displaying high-level, platform-wide analytics. This provides an at-a-glance view of the entire system's health and activity.

### 2.1. Key Performance Indicators (KPIs)

The dashboard will feature the following KPIs:

*   **Total Tenants:** A count of all active `ADMIN_TENANT` accounts.
*   **Total Users:** A count of all `MikrotikUser` records across all tenants.
*   **Platform-Wide Revenue:** A summary of all transactions across all tenants (Today, This Week, This Month).
*   **Total Routers Online:** A real-time count of all `MikrotikRouter` devices that are currently online.

### 2.2. Charts and Graphs

*   **New Tenants Over Time:** A bar chart showing the number of new `ADMIN_TENANT`s created each month for the current year.
*   **New Users Over Time (Platform-Wide):** A bar chart showing the number of new `MikrotikUser`s created across all tenants each month for the current year.

## 3. Tenant Management

A dedicated "Tenant Management" page will provide full CRUD (Create, Read, Update, Delete) functionality for `ADMIN_TENANT` accounts.

### 3.1. View All Tenants

*   A table will list all `ADMIN_TENANT` users.
*   **Columns:** `Name`, `Email`, `Phone`, `Status` (`Active`, `Suspended`), `Date Joined`, `Number of Users`.
*   The table will support sorting and searching.

### 3.2. Create New Tenant

*   A modal or dedicated page with a form to create a new `ADMIN_TENANT`.
*   **Fields:** `Full Name`, `Email`, `Phone`, `Password`.
*   Upon creation, a new `User` with the `ADMIN_TENANT` role will be created. Their `tenantOwner` will be set to their own `_id`.

### 3.3. Edit Tenant

*   The ability to edit an `ADMIN_TENANT`'s information (`Full Name`, `Email`, `Phone`).

### 3.4. Suspend / Reactivate Tenant

*   A button to change a tenant's status between `Active` and `Suspended`.
*   A suspended tenant and all their associated `STANDARD_USER`s will be unable to log in.

### 3.5. Delete Tenant

*   A button to permanently delete an `ADMIN_TENANT`.
*   **Crucially**, this action will trigger a cascading delete of all data associated with that tenant, including:
    *   All `STANDARD_USER`s belonging to the tenant.
    *   All `MikrotikRouter`s.
    *   All `MikrotikUser`s.
    *   All `Package`s.
    *   All `Transaction`s, `Bill`s, `Expense`s, etc.
*   A confirmation modal will be required to prevent accidental deletion.

## 4. Global Data Views

To facilitate support and platform management, the `SUPER_ADMIN` will have read-only access to the combined data of all tenants.

### 4.1. All Mikrotik Routers

*   A page listing all `MikrotikRouter`s from all tenants.
*   The table will include a **`Tenant` column** to identify the owner of each router.

### 4.2. All Mikrotik Users

*   A page listing all `MikrotikUser`s from all tenants.
*   The table will include a **`Tenant` column**.

### 4.3. All Packages

*   A page listing all `Package`s from all tenants.
*   The table will include a **`Tenant` column**.

## 5. Platform Settings

This section is for settings that affect the entire platform and can only be modified by the `SUPER_ADMIN`.

*   **Default Settings:** The ability to set the default `ApplicationSettings` for new tenants.
*   **System-wide Announcements:** A feature to create announcements that are visible to all `ADMIN_TENANT`s.
*   **Integration Management:** Configuration for platform-wide services (e.g., a master email sending service).
