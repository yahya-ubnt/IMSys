# Settings Module Specification

## Purpose
This module allows users to manage their personal account settings, including changing their username and password.

---

## UI Flow

When the user clicks on 'Settings' in the sidebar/navigation, they should be directed to this page.

---

## 1. Change Username & Password

**Purpose:** To allow authenticated users to update their full name (acting as a username) and password.

**Form Fields:**
- **Full Name** — `string` — *required*, pre-filled with current user's full name.
- **Current Password** — `password` — *required*, for verification.
- **New Password** — `password` — *required*, minimum 8 characters, strong password policy (e.g., mix of uppercase, lowercase, numbers, special characters).
- **Confirm New Password** — `password` — *required*, must match New Password.

**Save Action:**
- `PUT /api/users/profile` (or a dedicated endpoint like `/api/users/change-password`)
- The request body should include `fullName` (if changed), `currentPassword`, and `newPassword`.

**Validation:**
- `Full Name` is required.
- `Current Password` must match the user's actual current password (backend validation).
- `New Password` must meet strength requirements (frontend and backend validation).
- `New Password` and `Confirm New Password` must match (frontend validation).
- If `New Password` is provided, `Current Password` is required.

**UI Notes:**
- Clear success/error messages after submission.
- Password fields should be masked.

---

## 2. Application Branding Settings

**Purpose:** To allow administrators to customize the application's branding elements, such as the displayed name and logo icon. These changes should reflect globally across the application where branding is displayed (e.g., sidebar, login page).

**Form Fields:**
- **Application Name** — `string` — *required*, pre-filled with current application name (e.g., "MEDIATEK MANAGEMENT SYSTEM"). This will update the text displayed in the sidebar and potentially other branding areas.
- **Logo Icon** — `string` (Lucide Icon Name) — *optional*, pre-filled with current icon name (e.g., "Wifi"). This will update the icon displayed next to the application name. A dropdown or search input could be used to select from available Lucide icons.

**Save Action:**
- `PUT /api/settings/branding` (New endpoint)
- The request body should include `appName` and `logoIcon`.

**Validation:**
- `Application Name` is required.
- `Logo Icon` (if provided) must be a valid Lucide icon name (backend validation).

**UI Notes:**
- Clear success/error messages after submission.
- A preview of the selected logo icon should be displayed.
- This section should only be visible to users with administrative privileges.

---

## API Endpoints (New/Modified)

- `PUT /api/users/profile` (Auth) → Update user profile (including full name).
  - **Request Body (example for profile update):**
    ```json
    {
      "fullName": "Jane Doe"
    }
    ```
  - **Request Body (example for password change):**
    ```json
    {
      "currentPassword": "oldPassword123",
      "newPassword": "newStrongPassword456"
    }
    ```
    *(Note: It's generally better practice to have a separate endpoint for password changes for security reasons, e.g., `PUT /api/users/change-password`. If the backend doesn't have this, the frontend will need to send `currentPassword` and `newPassword` to `/api/users/profile` and the backend should handle it.)*

- `PUT /api/settings/branding` (Auth, Admin) → Update application branding settings.
  - **Request Body:**
    ```json
    {
      "appName": "My Custom App Name",
      "logoIcon": "Globe"
    }
    ```
- `GET /api/settings/branding` (Auth) → Retrieve current application branding settings.
  - **Response Body:**
    ```json
    {
      "appName": "MEDIATEK MANAGEMENT SYSTEM",
      "logoIcon": "Wifi"
    }
    ```

---

## Data Model (User - extended example)
The existing User data model will not need to be extended for these changes.

**ApplicationSettings**
```json
{
  "_id": "settings_branding_id", // Singleton document
  "appName": "MEDIATEK MANAGEMENT SYSTEM",
  "logoIcon": "Wifi",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## API Endpoints (New/Modified)

- `PUT /api/users/profile` (Auth) → Update user profile (including full name).
  - **Request Body (example for profile update):**
    ```json
    {
      "fullName": "Jane Doe"
    }
    ```
  - **Request Body (example for password change):**
    ```json
    {
      "currentPassword": "oldPassword123",
      "newPassword": "newStrongPassword456"
    }
    ```
    *(Note: It's generally better practice to have a separate endpoint for password changes for security reasons, e.g., `PUT /api/users/change-password`. If the backend doesn't have this, the frontend will need to send `currentPassword` and `newPassword` to `/api/users/profile` and the backend should handle it.)*

---

## Data Model (User - extended example)
The existing User data model will not need to be extended for these changes.

**User**
```json
{
  "_id": "user_123",
  "fullName": "Admin User",
  "email": "admin@example.com",
  "phone": "+254700000000",
  "isAdmin": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## UI Requirements (General)
- The page should be accessible only to authenticated users.
- Use Shadcn UI v0 components for forms.
- Ensure clear and concise labels and instructions.
- Provide immediate feedback on validation errors.
- Display success messages upon successful updates.
- Responsive design for various screen sizes.