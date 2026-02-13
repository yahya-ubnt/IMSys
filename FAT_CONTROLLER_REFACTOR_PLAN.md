# Plan: Fat Controller Refactor & State-Based Sync Upgrade

## 1. Objective
Refactor the backend to follow a **Service-Oriented Architecture** and implement a **Declarative State-Based Sync** engine. This will decouple business logic from hardware execution, ensuring high reliability, atomicity, and self-healing capabilities.

## 2. Target Architecture

### A. Controllers (The "Thin" Layer)
- **Role**: Handle incoming HTTP requests, parse parameters, and perform initial validation.
- **Action**: Delegate all business logic to a **Service** and return a standardized response.
- **Change**: Remove all direct database updates across multiple models and all direct MikroTik API calls.

### B. Service Layer (The "Brain")
- **Role**: Encapsulate business rules, multi-model updates, and external API orchestrations (e.g., M-Pesa).
- **Action**: Perform calculations, manage transactions (ACID), and update the "Desired State" in the database.
- **Trigger**: When a hardware change is needed, the Service updates the DB and notifies the **Sync Engine**.

### C. State-Based Sync Engine (The "Hands")
- **Role**: Ensure the MikroTik hardware matches the "Desired State" defined in the Database.
- **Action**: A background worker (`MikroTik-Sync` queue) that performs a **Check -> Diff -> Act** loop.
- **Benefit**: Idempotent operations. Safe retries. Automatic drift correction.

---

## 3. Specific Refactoring Modules

| Module | Current "Fat" Controller | New Service | Logic to Move |
| :--- | :--- | :--- | :--- |
| **Finance** | `paymentController.js`, `billController.js` | `PaymentService`, `BillingService` | STK callback logic, cash payment processing, wallet balance calculations ($inc), bill payment state updates. |
| **Users** | `mikrotikUserController.js` | `UserService` | User onboarding flow, initial package assignment, fee calculations, welcome SMS triggers. |
| **Hotspot** | `hotspotUserController.js`, `voucherController.js` | `HotspotService` | **[DEFERRED]** Voucher generation logic, session management, plan assignment. |
| **Network** | All controllers with direct `mikrotikUtils` calls | `MikrotikSyncEngine` | **ALL** hardware commands: `addUser`, `deleteUser`, `updateProfile`, `addIpBinding`, `enableNetwatch`. |

---

## 4. Implementation Roadmap

### Phase 1: Foundation (The Engine)
1.  **[DONE] Refactor `mikrotikSyncWorker.js`**: Convert the current `switch-case` command model to a single `syncUser(userId)` loop.
2.  **[DONE] Update `MikrotikUser` Model**: Add `lastSyncedAt` and ensure `syncStatus` is consistently used.
3.  **[DONE] Create Idempotent Utils**: Update `mikrotikUtils.js` functions to check state before acting (e.g., `ensureUserExists`, `ensureProfileMatches`).

### Phase 2: Financial Core (High Risk/High Reward)
1.  **[DONE] Create `PaymentService.js`**: Migrate `createCashPayment` and callback logic. Implement MongoDB Transactions for atomicity.
2.  **[DONE] Thin `paymentController.js`**: Update to use the new service.
3.  **[DONE] Trigger Sync**: Ensure payment services trigger a `syncUser` job instead of calling MikroTik directly.

### Phase 3: User & Hardware Management
1.  **[DONE] Create `UserService.js`**: Migrate user creation and package update logic.
2.  **[DONE] Thin `mikrotikUserController.js`**: Remove hardware-specific code and direct model updates.

### Phase 4: Self-Healing & Monitoring
1.  **[DONE] Simplify Reconciliation**: Update `reconcileMikrotikState` to simply identify "Out of Sync" users and push them to the generic `syncUser` queue.
2.  **[DONE] Integrate Dashboard**: Update `mikrotikDashboardController.js` to pull cached state from the DB where possible, rather than blocking on live API calls.

---

## 5. Verification Strategy
- **Unit Tests**: Implement Jest tests for each new Service to verify business rules independently of hardware.
- **Integration Tests**: Test the queue-based sync logic by simulating router timeouts and partial successes.
- **Manual QA**: Verify STK push -> Auto-reconnect flow on real hardware.
