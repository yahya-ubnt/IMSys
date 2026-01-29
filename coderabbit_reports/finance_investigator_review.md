# Manual Code Review: Finance & Payment Module
**Date:** January 29, 2026
**Reviewer:** Codebase Investigator Agent

## 🚨 Critical Security & Logic Findings

### 1. 🔓 Unauthenticated Payment Callbacks (Critical)
**File:** `backend/controllers/paymentController.js`
**Issue:** The `handleDarajaCallback` function is exposed publicly (as it must be for M-Pesa) but lacks sufficient verification that the request actually came from Safaricom.
**Impact:** A malicious actor could POST fake successful payment data to this endpoint, crediting their account without paying.
**Recommendation:** Implement IP whitelisting for Safaricom's servers and verify the request signature if available.

### 2. 🏁 Race Condition in Wallet Updates (High Severity)
**File:** `backend/utils/paymentProcessing.js`
**Function:** `processSubscriptionPayment`
**Issue:** The code reads the user's wallet balance, calculates a new balance in memory, and then saves the user document.
```javascript
// Current (Vulnerable)
const user = await MikrotikUser.findById(userId);
user.walletBalance += amount;
await user.save();
```
**Impact:** If two payments happen simultaneously (or a payment and a usage deduction), one update will overwrite the other, causing "lost money".
**Recommendation:** Use atomic MongoDB operators:
```javascript
// Recommended
await MikrotikUser.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } });
```

### 3. 💥 Transaction ID Collisions
**File:** `backend/utils/paymentProcessing.js`
**Issue:** Transaction IDs are generated using `Date.now()`.
```javascript
const transactionId = `TXN-${Date.now()}`;
```
**Impact:** If two users pay within the same millisecond (very common at scale), the second transaction will crash due to duplicate key error, or worse, overwrite data.
**Recommendation:** Use `uuid` or append a random string/process ID to the timestamp.

### 4. 🛑 Missing Atomic Transactions (Data Integrity)
**File:** `backend/services/mpesaService.js` -> `backend/utils/paymentProcessing.js`
**Issue:** A payment creates a `Transaction` record, updates a `MikrotikUser`, and creates a `WalletTransaction`. These are separate DB calls.
**Impact:** If the server crashes after creating the `Transaction` but before updating the `MikrotikUser`, the system has a record of money received but the user gets no service.
**Recommendation:** Wrap these operations in a MongoDB Transaction (Session).

### 5. 👻 Incomplete Manual Wallet Top-ups
**File:** `backend/controllers/paymentController.js`
**Function:** `createWalletTransaction`
**Issue:** This function creates a `WalletTransaction` record but **does not actually update the user's wallet balance** in the `MikrotikUser` model.
**Impact:** Admins will "add funds" to a user, seeing a success message, but the user's actual balance will never change.
**Recommendation:** Ensure `processSubscriptionPayment` or a similar utility is called to actually apply the funds.

## ⚠️ Code Quality & Maintenance

### 6. Duplicated Callback Logic
**File:** `backend/services/mpesaService.js`
**Issue:** `processStkCallback` and `processC2bCallback` share 90% of the same logic for parsing, finding users, and logging.
**Recommendation:** Extract a common `handlePaymentSuccess` internal method.

### 7. Hardcoded Tenant Assumptions
**File:** `backend/utils/paymentProcessing.js`
**Issue:** Some queries assume a single tenant context or rely on the user object to carry the tenant ID implicitly without validation.
**Recommendation:** Pass `tenantId` explicitly to all payment processing functions to ensure funds don't bleed across tenants.

---
**Next Steps:**
I recommend prioritizing **Fix #2 (Race Condition)** and **Fix #5 (Manual Top-up Bug)** as they directly affect user balances and admin trust.
