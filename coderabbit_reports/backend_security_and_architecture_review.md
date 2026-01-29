# CodeRabbit Backend Security & Architecture Review
**Date:** January 29, 2026
**Source:** CodeRabbit CLI (`coderabbit review --plain`)

## Executive Summary
This report aggregates findings from an AI-driven review of the IMSys backend. The review identified **Critical Security Vulnerabilities** related to authentication bypasses across multiple modules. Immediate remediation is required before any further feature development.

## 🚨 Critical Findings

### 1. Global Authentication Bypass (High Severity)
**Issue:** The `protect` middleware, responsible for JWT verification and user session attachment, has been systematically removed from approximately 15 administrative route files.
**Impact:** Routes protected only by `isSuperAdminOrAdmin` (or similar role checks) are vulnerable. If these role middlewares do not independently verify the token (which they currently do not), unauthenticated users may access sensitive endpoints or cause server crashes (due to undefined `req.user`).

**Affected Routes:**
*   `backend/routes/billRoutes.js`
*   `backend/routes/ticketRoutes.js`
*   `backend/routes/collectionRoutes.js`
*   `backend/routes/packageRoutes.js`
*   `backend/routes/hotspotPlanRoutes.js`
*   `backend/routes/deviceRoutes.js`
*   `backend/routes/hotspotStkRoutes.js`
*   `backend/routes/diagnosticRoutes.js`
*   `backend/routes/dashboardRoutes.js`
*   `backend/routes/dailyTransactionRoutes.js`
*   `backend/routes/mikrotikDashboardRoutes.js`
*   `backend/routes/settingsRoutes.js`
*   `backend/routes/voucherRoutes.js`
*   `backend/routes/reportRoutes.js`
*   `backend/routes/tenantRoutes.js`

**Proposed Solution:**
Restore the `protect` middleware chain in all affected files.
```javascript
// BEFORE (Vulnerable)
router.route('/').get(isSuperAdminOrAdmin, getItems);

// AFTER (Secure)
router.route('/').get(protect, isSuperAdminOrAdmin, getItems);
```

### 2. Silent Encryption Failures (Security Risk)
**Location:** `backend/models/ApplicationSettings.js`
**Issue:** The `jsonEncrypt` and `jsonDecrypt` helpers fail silently on errors. If encryption fails, `jsonEncrypt` may return the raw, unencrypted value, which is then stored in the database.
**Impact:** Sensitive credentials (M-Pesa keys, SMTP passwords) could be stored in plain text.

**Proposed Solution:**
Modify helpers to throw explicit errors on failure to prevent unsafe data persistence.

### 3. Publicly Exposed Upload Endpoints
**Location:** `backend/server.js`
**Issue:** `uploadRoutes` are mounted *before* the global authentication middleware.
**Impact:** Unauthenticated users can upload files, leading to potential DoS or malicious content hosting.

**Proposed Solution:**
Move the `app.use('/api/upload', ...)` line below `app.use('/api', protect)`.

### 4. Missing Input Validation
**Location:** `backend/routes/smsAcknowledgementRoutes.js`
**Issue:** Server-side validation (express-validator) was removed.
**Impact:** Increased risk of database corruption or injection attacks.

## Architectural Observations
*   **Middleware Fragmentation:** The project has inconsistent auth patterns (`protect` vs. `authMiddleware`).
*   **Controller Monoliths:** Some controllers (e.g., `billController`) handle too much logic (validation, db access, business logic) which should be separated into Services.

## Recommendations
1.  **Immediate Fix:** Revert the removal of `protect` middleware across all identified routes.
2.  **Refactor:** Centralize auth logic. If `isSuperAdmin` implies "Authenticated", the middleware itself should enforce that, rather than relying on the correct chaining order in every route file.
3.  **Hardening:** Implement the `ApplicationSettings` encryption fix to fail closed (securely).
