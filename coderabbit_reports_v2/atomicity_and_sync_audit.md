# Audit Report: Two-Phase Atomicity & Hardware Reconciliation
Date: 2026-02-04
Status: 🔴 Structural Gap (Confirmed in Codebase)

## 1. Executive Summary
The system relies on a **Sequential Fire-and-Forget** pattern. There is no transactional integrity between the MongoDB state and the MikroTik RouterOS state. This leads to "Distributed State Desync," where the database represents a state that does not exist on the physical network.

## 2. Detailed Audit Findings

| Area | File Path | Current Logic Flow | Risk |
| :--- | :--- | :--- | :--- |
| **User Onboarding** | `controllers/mikrotikUserController.js` | `MikrotikUser.create()` -> `RouterOSAPI.write()` | **High**: If API fails, DB record remains. User is billed but has no service. |
| **Package Changes** | `controllers/mikrotikUserController.js` | `user.save()` -> `RouterOSAPI.write()` | **High**: DB updates plan/price immediately. API failure leaves user on old speeds/profile. |
| **Expiry/Discon.** | `scripts/disconnectExpiredClients.js` | `RouterOSAPI.write()` -> `MikrotikUser.findByIdAndUpdate()` | **Medium**: "Safe" for business, but DB can show user as "Active" if script crashes mid-loop. |
| **Voucher Gen.** | `controllers/voucherController.js` | Loop (`addHotspotUser()` -> `voucher.save()`) | **Medium**: Partial batches. Router gets "orphan" users that the DB doesn't know about. |
| **Reconciliation** | N/A | No existing logic. | **Critical**: No way to automatically fix desyncs without manual admin intervention. |

## 3. Manual vs. Cron Behavior
Our investigation reveals two distinct (and conflicting) patterns:

- **Manual Actions (Controllers):** Prioritize the **Database**. They update MongoDB first to ensure the request is "captured." Failure in the Hardware API leaves a "Zombies" in the DB.
- **Cron Tasks (Scripts):** Prioritize the **Hardware**. They attempt to disconnect the user on the router first. If this succeeds but the DB update fails, the user is "Ghosted" (disconnected but shown as active in the UI).

**Conclusion:** Neither approach is atomic. Both require a unified Sync Service.

## 4. Refined Recommendations

### 1. User Onboarding (Atomicity: REQUIRED)
*   **Recommendation:** Use a "Draft" state. Create the user with `provisionedOnMikrotik: false`. Only mark as `true` after API success. If API fails, provide an immediate "Retry" button in the UI.

### 2. Package Changes (Atomicity: CRITICAL)
*   **Recommendation:** Move to a **Declarative Sync**. Instead of updating the `package` ID directly, update a `pendingPackage` field. The `SyncService` should attempt the router update and only swap the actual `package` field on success.

### 3. Expiry/Disconnection (Atomicity: Guaranteed Completion)
*Current Implementation in `controllers/mikrotikUserController.js` & `scripts/disconnectExpiredClients.js`:*
```javascript
// 1. Talk to Hardware
await client.write('/ppp/secret/set', ['=.id=' + id, '=disabled=yes']); 
// 2. Update DB
await MikrotikUser.findByIdAndUpdate(userId, { isSuspended: true });
```

**The Risk:** If step 1 succeeds but the script/server crashes before step 2, the user is **"Ghosted."** They are disconnected, but your dashboard shows them as "Active." Conversely, if step 1 fails (router offline), step 2 is skipped, and the user gets **free internet** until an admin notices.

**Recommendation:**
Instead of "Rollback," we need **Guaranteed Completion**.
- Set `isSuspended: true` and `syncStatus: 'pending_disconnect'` in the DB first.
- BullMQ ensures the router *eventually* receives the command.
- The router remains the "Slave" to the Database "Master."

## 4. Reliability in Unstable Networks (The Acknowledgment Gap)
A common misconception is that "waiting for a response" ensures synchronization. In ISP networking, this is a fallacy due to the **Ghost Success** scenario:

1. **The Request**: The server sends a `disable` command to the router.
2. **The Action**: The MikroTik receives the request and successfully disables the user.
3. **The Glitch**: A network micro-outage occurs *after* the action but *before* the reply.
4. **The Response Failure**: The server times out, assumes the hardware never received the command, and **skips the DB update**.
5. **The Desync**: The user is disabled in reality, but "Active" in the DB.

### Why Asynchronous Sync is Better:
Instead of a linear chain that fails when a response is missing, we move to a **State-Based Loop**:
- **Goal State**: DB defines the truth (e.g., `isSuspended: true`).
- **Worker Logic**: The system persistently attempts to align the hardware with the DB goal.
- **Idempotency**: If the hardware is *already* disabled (e.g., from a previous "Ghost Success"), the worker simply confirms the match and updates the DB to `synced`.

## 5. Impact Assessment: Will this affect other things?
**Highly Unlikely to break logic, but changes the "Feeling" of the app:**
1. **Low Risk to Router Logic**: We are using the same `mikrotikUtils` commands, just moving *where* they are called from (Controllers -> Workers).
2. **Model Change**: Adding `syncStatus` to the schema is a safe, additive change.
3. **UI Change**: The frontend will need to handle the fact that a user might be "Suspended" in the DB but still "Syncing" to the router.
4. **Architectural Shift**: Moving from **Synchronous** (Wait for router) to **Asynchronous** (Tell queue and move on) makes the app more resilient to network lag.

### 4. Voucher Generation (Atomicity: REQUIRED)
*   **Recommendation:** Use a "Batch Lock". Mark the entire batch as `pending`. If the loop fails, the system should offer a "Cleanup" function to remove the orphan users from the MikroTik router.

### 5. Reconciliation (The Ultimate Safety Net)
*   **Recommendation:** Implement a `ReconciliationEngine` that:
    1. Fetches all active users from MikroTik.
    2. Fetches all active users from MongoDB.
    3. Identifies discrepancies (e.g., User exists in DB but not on Router).
    4. Auto-corrects the state.

## 5. Implementation via BullMQ (The Engine)

Our investigation of `BULLMQ_ARCHITECTURE.md` confirms that the proposed **Sync Service** should be implemented using BullMQ workers.



### How it solves the UX Problem:

1. **Zero UI Freeze**: The Controller updates the DB and pushes a job to Redis in <50ms. The user receives an immediate "Request Accepted" response.

2. **Background Durability**: If the MikroTik router is offline, BullMQ's **Exponential Backoff** retries the operation automatically. The admin doesn't need to click "Retry" manually.

3. **Progressive UX**: The UI should display a "Syncing..." status (e.g., using a `syncStatus` field) while the worker processes the hardware command.



### Latency Expectations:

- **User Perception**: 50ms (API Response).

- **Actual Hardware Sync**: 500ms - 5s (Background).

- **Result**: The application feels significantly snappier as the hardware latency is decoupled from the HTTP request/response cycle.



## 6. Final Recommendations Checklist



- [ ] **Migrate Controllers**: Refactor `createMikrotikUser` and `updateMikrotikUser` to push to the `MikroTik-Sync` queue.



- [ ] **Add `syncStatus`**: Add `pending`, `synced`, `error` enum to `MikrotikUser` model.



- [ ] **Optimistic UI**: Update the frontend to show "Pending" states for hardware-linked records.



- [ ] **Reconciliation Worker**: Implement the 15-minute sweep as a repeatable BullMQ job.








