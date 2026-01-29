# Backend Master TODO List
**Date:** January 29, 2026
**Status:** In Progress

This document aggregates all findings from the initial CodeRabbit scan, Infrastructure Review, and Deep Finance Logic Review.

## 🚨 Tier 0: Critical Security & Integrity (Immediate Fixes)

### 1. Global Auth Bypass
- [ ] **Restore `protect` Middleware:** Re-add `protect` before `isSuperAdminOrAdmin` in all 15+ route files (e.g., `billRoutes`, `paymentRoutes`, `dashboardRoutes`).
- [ ] **Secure Uploads:** Move `app.use('/api/upload', ...)` below the global auth middleware in `server.js`.

### 2. Finance Logic Criticals
- [ ] **Fix Race Condition:** Update `processSubscriptionPayment` in `backend/utils/paymentProcessing.js` to use `$inc` atomic operators for wallet updates instead of `user.walletBalance += amount; user.save()`.
- [ ] **Fix Manual Top-up Bug:** In `backend/controllers/paymentController.js` (`createWalletTransaction`), ensure the user's actual wallet balance is updated, not just the transaction record created.
- [ ] **Fix ID Collisions:** Replace `TXN-${Date.now()}` with `uuid` or a collision-resistant generator in `backend/utils/paymentProcessing.js`.

### 3. Payment Security
- [ ] **Verify M-Pesa Callbacks:** Implement IP whitelisting (Safaricom IPs) and request signature verification in `handleDarajaCallback` (`backend/controllers/paymentController.js`).

### 4. Encryption Safety
- [ ] **Hardening:** Modify `jsonEncrypt` in `backend/models/ApplicationSettings.js` to throw errors on failure instead of returning raw/undefined data.

---

## 🚧 Tier 1: Infrastructure & Architecture (High Priority)

### 1. Authentication Unification
- [ ] **Consolidate Middleware:** Merge `authMiddleware.js` (Cookie-based) and `protect.js` (Bearer-based) into a single, consistent auth handler.
- [ ] **Enforce Tenancy:** Ensure the unified middleware populates `req.user.tenant` for *all* requests.
- [ ] **DB Verification:** Update auth middleware to verify the user exists in the DB (don't just trust the JWT payload) to handle revoked roles/deleted users.

### 2. Mikrotik & Network Security
- [ ] **Tenant Isolation:** Add explicit tenant ownership checks to `mikrotikRouterConnector` in `mikrotikMiddleware.js` (User A cannot control User B's router).
- [ ] **Unify Libraries:** Refactor to use a single RouterOS library (Standardize on `RouterOSAPI` or `RouterOSClient`) across `mikrotikMiddleware.js` and `mikrotikDashboardMiddleware.js`.

### 3. Database Integrity
- [ ] **Atomic Transactions:** Wrap payment flows (`Transaction` creation + `Wallet` update + `User` update) in MongoDB Sessions/Transactions to prevent partial failures.

---

## 🧹 Tier 2: Code Quality & Maintenance (Medium Priority)

### 1. Refactoring
- [ ] **Dedup Callback Logic:** Extract common logic from `processStkCallback` and `processC2bCallback` in `backend/services/mpesaService.js`.
- [ ] **Service Layer:** Move heavy business logic from `billController.js` and `paymentController.js` into dedicated services.

### 2. Validation
- [ ] **Restore Validation:** Re-add `express-validator` checks to `backend/routes/smsAcknowledgementRoutes.js`.

---

## 📝 Next Steps
1.  Complete **Tier 0** items immediately.
2.  Run `coderabbit review` again (once limit resets) to verify fixes.
3.  Proceed to **Tier 1** before starting major Frontend work.
