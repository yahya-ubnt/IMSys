# Email Notification System Specification

## 1. Objective

To implement a robust email notification system with two distinct channels, extending the capabilities outlined in `notifications-spec.md`:
1.  **Admin Notifications:** For system-level events, sent to a configurable list of administrators.
2.  **Customer Notifications:** For user-specific events (e.g., billing), sent to individual customers, who can opt-out.

## 2. Core Backend Setup

### 2.1. Dependency
- **Action:** Add `nodemailer` to the backend dependencies.
- **File:** `backend/package.json`

### 2.2. Configuration
- **Action:** Add new environment variables for the SMTP service.
- **File:** `backend/config/env.js` (or similar configuration management)
- **Variables:**
  ```
  EMAIL_HOST="smtp.example.com"
  EMAIL_PORT=587
  EMAIL_USER="your-smtp-username"
  EMAIL_PASS="your-smtp-password"
  EMAIL_FROM="ISP Name <no-reply@isp.com>"
  ```

### 2.3. Email Service
- **Action:** Create a new, reusable email service.
- **File:** `backend/services/emailService.js`
- **Details:** This service will initialize a `nodemailer` transport using the environment variables and export a single function: `sendEmail({ to, subject, text, html })`.

---

## 3. Admin Notification Implementation

### 3.1. Data Model (`ApplicationSettings.js`)
- **Action:** Add a field to store a list of admin email addresses.
- **File:** `backend/models/ApplicationSettings.js`
- **Addition to `ApplicationSettingsSchema`:**
  ```javascript
  adminNotificationEmails: {
    type: [String],
    default: []
  }
  ```

### 3.2. Backend Logic
- When a system-level event occurs (e.g., critical error, new high-priority ticket), the application logic will:
  1. Fetch the `ApplicationSettings`.
  2. Retrieve the `adminNotificationEmails` array.
  3. If the array is not empty, loop through it and use `emailService.sendEmail` to send the notification to each admin.

### 3.3. Frontend UI (Admin Settings)
- **Action:** Add a new **"Email"** tab to the main settings page for administrators.
- **File to Modify:** `frontend/src/app/settings/page.tsx`
- **Details:**
    1. Import a suitable icon, e.g., `Bell` from `lucide-react`: `import { ..., Bell } from "lucide-react";`
    2. Add a new object to the `tabs` array: `{ id: "email", label: "Email", icon: Bell }`
    3. Create a new component file: `frontend/src/app/settings/email/page.tsx`. This component will contain the UI (a form) to manage the list of admin emails.
    4. Import and render this new component within a new `<StyledTabsContent>` tag in `frontend/src/app/settings/page.tsx`:
        ```jsx
        <StyledTabsContent value="email" className="mt-4">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <EmailSettingsPage />
            </div>
          </div>
        </StyledTabsContent>
        ```

---

## 4. Customer (Mikrotik User) Notification Implementation

### 4.1. Data Model (`MikrotikUser.js`)
- **Action:** Add a field to manage the user's email notification preference.
- **File:** `backend/models/MikrotikUser.js`
- **Addition to `MikrotikUserSchema`:**
  ```javascript
  emailNotificationsEnabled: {
    type: Boolean,
    default: true
  }
  ```

### 4.2. Backend Logic
- When a user-specific event occurs (e.g., bill generation, payment reminder):
  1. Fetch the target `MikrotikUser`.
  2. Check if `emailNotificationsEnabled` is `true` and `emailAddress` is not empty.
  3. If both are true, use `emailService.sendEmail` to send the notification to the user's `emailAddress`.

### 4.3. Frontend UI (Customer Profile)
- **Action:** Add a preference toggle to the customer management page.
- **Location:** In the Mikrotik User's detail/edit page.
- **Functionality:** An admin can enable or disable email notifications for a specific customer using a toggle switch. This will update the `emailNotificationsEnabled` flag on the `MikrotikUser` model via an API call.
