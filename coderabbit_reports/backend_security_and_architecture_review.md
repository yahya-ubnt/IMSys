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

### **Updated Remediation Plan (As of Jan 30, 2026)**

Further analysis revealed that the root cause is a deeper architectural issue:

*   **Two Competing Middlewares:** The system has two authenticators: `backend/middlewares/authMiddleware.js` (cookie-based) and `backend/middlewares/protect.js` (Bearer token-based).
*   **Incorrect Global Middleware:** `server.js` applies the weaker, cookie-based middleware globally to all `/api/*` routes.
*   **Widespread Vulnerability:** The lack of `protect` middleware is not confined to 15 files but is a systemic issue, as developers were likely relying on the incorrect global middleware.

**The agreed-upon standard is to consolidate all authentication and authorization into a single, secure middleware.**

**Action Plan:**
1.  **Standardize on `protect.js`:** The more secure Bearer-token middleware (`protect.js`) will become the single source of truth for authentication. It will be enhanced to perform a database lookup on every request to ensure user data is current.
2.  **Consolidate Role Checks:** The role-checking functions (`isSuperAdmin`, `isAdmin`, `isSuperAdminOrAdmin`) will be moved from `authMiddleware.js` into `protect.js`.
3.  **Deprecate and Remove `authMiddleware.js`:** Once consolidation is complete, this file will be deleted to prevent future use.
4.  **Explicit Route Protection:** All routes requiring authentication will be explicitly protected in their respective route files. The global `app.use('/api', protect)` in `server.js` will be updated to use the new standard middleware, but local protection will be added for clarity and safety.
5.  **Systematic Rollout:** This new standard will be applied systematically across all routes, starting with the ones identified in this report.

### **Progress Update (As of Jan 30, 2026)**

**Phase 1: Architectural Refactoring (Complete)**
*   ✅ **Auth Logic Consolidated:** All authentication and authorization logic has been merged into `backend/middlewares/protect.js`. This file now uses the secure Bearer Token strategy and contains all role-checking functions.
*   ✅ **Insecure Middleware Deleted:** The old, cookie-based `backend/middlewares/authMiddleware.js` has been deleted from the codebase.
*   ✅ **Global Middleware Removed:** The global `app.use('/api', protect)` has been removed from `server.js`. This enforces an explicit, safer security model where every route must be individually protected.

**Phase 2: Initial Rollout (Complete)**
*   ✅ The new standardized `protect` middleware has been successfully applied to all 15 route files originally identified as vulnerable in this report.

### **Next Steps: System-Wide Rollout**

Our initial analysis revealed that the lack of protection was systemic. The following ~20 route files were also identified as using the same vulnerable pattern and must be updated to use the new `protect` middleware.

**Remaining Files to Secure:**
*   `expenseRoutes.js`
*   `expenseTypeRoutes.js`
*   `hotspotUserRoutes.js`
*   `invoiceRoutes.js`
*   `leadRoutes.js`
*   `mikrotikRouterRoutes.js`
*   `mikrotikUserRoutes.js`
*   `notificationRoutes.js`
*   `paymentRoutes.js`
*   `scheduledTaskRoutes.js`
*   `searchRoutes.js`
*   `smsAcknowledgementRoutes.js`
*   `smsExpiryScheduleRoutes.js`
*   `smsProviderRoutes.js`
*   `smsRoutes.js`
*   `smsTemplateRoutes.js`
*   `superAdminRoutes.js`
*   `technicianActivityRoutes.js`
*   `transactionRoutes.js`
*   `uploadRoutes.js`
*   `userRoutes.js`


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
