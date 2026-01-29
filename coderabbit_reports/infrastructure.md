# CodeRabbit Review Report: Infrastructure & Security
Date: 2026-01-28
Module: backend/config, backend/middlewares

## Analysis of Issues

### 🔴 Critical Issues
- **[CRITICAL] Auth Logic Fragmentation**: The project has two separate authentication middlewares (`authMiddleware.js` and `protect.js`) with conflicting logic. `authMiddleware.js` expects cookies, while `protect.js` expects Bearer headers. This leads to inconsistent security across routes.
- **[CRITICAL] Missing Tenant Isolation in `protect.js`**: The `protect` middleware in `protect.js` does not populate `req.user.tenant`, which is essential for multi-tenancy.
- **[CRITICAL] Security Bypass in `mikrotikMiddleware.js`**: The router connection middleware in `mikrotikMiddleware.js` lacks a tenant ownership check. A user can access any router by its ID regardless of ownership.

### 🛡️ Security Issues
- **[SECURITY] JWT Payload Trust**: `authMiddleware.js` trusts the JWT payload (`id`, `tenant`, `roles`) without a database verification. While faster, if a user's roles are revoked or they are deleted, the JWT remains valid until expiration.
- **[SECURITY] Router Password Decryption Error Handling**: Errors during decryption might leak system-level encryption issues to the logs.

### 🟡 Suggestions & Improvements
- **Code Duplication**: `mikrotikDashboardMiddleware.js` and `mikrotikMiddleware.js` should be consolidated into a single utility or service.
- **Library Inconsistency**: One middleware uses `RouterOSAPI` while the other uses `RouterOSClient`. These should be unified.

## Fixes Applied
1.  **Consolidated Auth**: (Plan to merge `protect.js` into `authMiddleware.js` or vice-versa).
2.  **Added Tenant Check**: Added ownership verification to `mikrotikMiddleware.js`.
3.  **Unified Router Logic**: Consolidated the MikroTik connection logic.

## Verification
- [ ] Manual review of consolidated middleware.
- [ ] Test route access with cross-tenant IDs.
