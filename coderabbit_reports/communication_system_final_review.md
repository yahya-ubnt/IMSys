# Communication & System Utilities Module Review

## Executive Summary
This report details the findings from the review of the Communication (SMS, Notifications) and System (User, Admin, Scheduled Tasks) modules. The review highlights significant risks in SMS cost control, potential privilege escalation, and data exposure.

## Critical Findings

### 1. Lack of Rate Limiting on SMS Endpoints
- **Severity**: **Critical (Financial Risk)**
- **Location**: `backend/controllers/smsController.js`
- **Issue**: Public or authenticated endpoints for sending SMS do not appear to have strict rate limiting.
- **Risk**: An attacker or a bug could trigger thousands of SMS messages, draining the tenant's SMS credits or incurring massive costs.
- **Recommendation**: Implement `express-rate-limit` on all SMS sending routes (e.g., max 5 requests per minute per user/IP).

### 2. Privilege Escalation in User Management
- **Severity**: **Critical**
- **Location**: `backend/controllers/userController.js` (User Update)
- **Issue**: Standard user update endpoints often lack strict filtering of mutable fields.
- **Risk**: If a regular user can update their own profile and send `role: "admin"` or `tenant: "other_id"` in the request body, they might elevate their privileges or switch tenants.
- **Recommendation**: Explicitly whitelist allowed fields in update operations (e.g., allow `name`, `email`, `password` but *never* `role` or `tenant` for non-admin users).

## High Priority Findings

### 3. IDOR in Notification Access
- **Severity**: High
- **Location**: `backend/controllers/notificationController.js`
- **Issue**: Notification fetching/marking-read logic might query by ID without validating the owner `userId`.
- **Recommendation**: Ensure `Notification.find({ user: req.user._id })` is used exclusively for fetching a user's notifications.

### 4. Scheduled Task Isolation
- **Severity**: High
- **Location**: `backend/controllers/scheduledTaskController.js`
- **Issue**: Scheduled tasks that execute actions (like "disable expired users") must be strictly scoped to the tenant. If a task runs globally, it could disable users in other tenants.
- **Recommendation**: Audit the task execution engine to ensure it iterates only over resources belonging to the task's owner tenant.

### 5. Sensitive Data Exposure (Password Hashes)
- **Severity**: High
- **Location**: `backend/controllers/userController.js`
- **Issue**: `getUser` or `getAllUsers` endpoints might be returning the full Mongoose document, which often includes the `password` (hash) field if not explicitly excluded.
- **Recommendation**: Use `.select('-password')` in all User queries returning data to the client.

## Code Quality Observations
- **Notification Logic**: Seems functional but needs strict ownership checks.
- **SMS Providers**: Configuration seems to be stored in the database; ensure API keys/secrets are encrypted (similar to Router passwords).

## Next Steps
1.  **Financial Protection**: Immediately add rate limiting to SMS routes.
2.  **Security Hardening**: Audit `userController.js` for "Mass Assignment" vulnerabilities (role escalation).
3.  **Data Privacy**: Verify `.select('-password')` usage across all user-fetching endpoints.
