# Network & Management Module Review

## Executive Summary
This report details the findings from a deep security and architectural review of the Network and Management modules (`backend/controllers/mikrotik*`, `hotspot*`, etc.). The review combined automated analysis with manual code inspection, focusing on multi-tenancy isolation, security vulnerabilities, and data integrity.

## Critical Findings

### 1. Critical IDOR in Mikrotik Middleware
- **Severity**: **Critical**
- **Location**: `backend/middlewares/mikrotikMiddleware.js`
- **Issue**: The `connectToRouter` function (implied usage) or the logic fetching routers for connection often lacks a tenant ownership check. If this middleware fetches a router by `_id` without filtering by `req.user.tenant`, any authenticated user can control any router in the system.
- **Recommendation**: Ensure every database query for `MikrotikRouter` includes the tenant filter.
  ```javascript
  // Vulnerable
  const router = await MikrotikRouter.findById(routerId);
  
  // Secure
  const router = await MikrotikRouter.findOne({ _id: routerId, tenant: req.user.tenant });
  if (!router) throw new Error('Router not found or access denied');
  ```

### 2. Cross-Tenant Privilege Escalation in Hotspot User Creation
- **Severity**: **Critical**
- **Location**: `backend/controllers/hotspotUserController.js` (Line ~20)
- **Issue**: In `createHotspotUser`, the code fetches the target router using `MikrotikRouter.findById(mikrotikRouter)` without checking if the router belongs to the current user's tenant.
- **Exploit**: A user from Tenant A can create a hotspot user on Tenant B's router if they guess the router ID.
- **Fix**:
  ```javascript
  // Change line ~20 from:
  // const router = await MikrotikRouter.findById(mikrotikRouter);
  
  // To:
  const router = await MikrotikRouter.findOne({ _id: mikrotikRouter, tenant: req.user.tenant });
  ```

## High Priority Findings

### 3. Server-Side Request Forgery (SSRF) Risk
- **Severity**: High
- **Location**: `backend/controllers/mikrotikRouterController.js` (`testMikrotikConnection`)
- **Issue**: The endpoint accepts an arbitrary `ipAddress` and credentials to test a connection. An attacker can use this to scan the internal network of the server or launch attacks from the server's IP.
- **Recommendation**: 
  - Restrict this endpoint to Super Admins only.
  - Or validate that the IP is not a private/local IP (unless intended).
  - Or require the IP to match an already registered router for that tenant.

### 4. Potential IDOR / Information Leak in Hotspot Sessions
- **Severity**: High
- **Location**: `backend/controllers/hotspotSessionController.js` (`getSessionStatus`)
- **Issue**: The endpoint queries session status by `macAddress` only: `HotspotSession.findOne({ macAddress })`.
- **Risk**: If a user knows another user's MAC address, they can view their session status (expiry time, etc.), potentially across tenants if MACs are unique globally but not scoped.
- **Fix**: Scope the query to the tenant if possible, or ensure the endpoint is public-safe and returns minimal info. Ideally:
  ```javascript
  const session = await HotspotSession.findOne({ macAddress, tenant: req.user.tenant }); // If authenticated
  ```

### 5. Data Integrity: Mikrotik-Database Desync
- **Severity**: Medium
- **Location**: `backend/controllers/hotspotUserController.js`
- **Issue**: The controller calls `addHotspotUser` (Router API) *before* saving the user to MongoDB. If the MongoDB save fails (validation, database down), the user exists on the router but not in the app, creating an "orphan" account.
- **Recommendation**:
  - Use a compensation pattern: If `user.save()` fails, call `removeHotspotUser` to roll back the change on the router.

## Code Quality Observations
- **Tenant Isolation**: generally well-implemented in standard CRUD operations (e.g., `getMikrotikRouters` uses `find({ tenant: req.user.tenant })`). The gaps are primarily in "action" endpoints (create, connect).
- **Encryption**: Router passwords are correctly encrypted at rest.

## Next Steps
1. **Immediate Patch**: Apply the tenant check fix to `backend/controllers/hotspotUserController.js` and `backend/middlewares/mikrotikMiddleware.js`.
2. **Security Hardening**: Restrict `testMikrotikConnection`.
3. **Refactor**: Implement the rollback logic for Mikrotik user creation.
