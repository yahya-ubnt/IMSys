# Refactor Plan: Enterprise-Grade Static User Management

This plan outlines the migration from a throttle-based (1k/1k) disconnection method to a Firewall Address List approach, while also introducing proper Static DHCP Leases based on MAC addresses.

## 1. Database Schema Update [COMPLETED]
- **Target File**: `backend/models/MikrotikUser.js`
- **Changes**:
    - [x] Add `macAddress` field (String).
    - [x] Add unique index for `tenant` + `macAddress`.
- **Reason**: Enables professional DHCP reservations.

## 2. API & Controller Updates [COMPLETED]
- **Target File**: `backend/controllers/mikrotikUserController.js`
- **Changes**:
    - [x] Update `createMikrotikUser` to accept and validate `macAddress`.
    - [x] Update `updateMikrotikUser` to accept and validate `macAddress`.
    - [x] Ensure `macAddress` is passed to the sync worker.

## 3. Worker Logic Refactor (The Core) [COMPLETED]
- **Target File**: `backend/workers/mikrotikSyncWorker.js`
- **`addUser` Action**:
    - [x] Create Static DHCP Lease: `/ip/dhcp-server/lease/add address=IP mac-address=MAC comment=USERNAME`.
    - [x] Create Simple Queue: `/queue/simple/add`.
- **`disconnectUser` Action**:
    - [x] **Remove** 1k/1k throttling and queue disabling.
    - [x] **Add** to Address List: `/ip/firewall/address-list/add list=BLOCKED_USERS address=IP comment=USERNAME`.
- **`connectUser` Action**:
    - [x] **Remove** queue enabling/speed reset logic.
    - [x] **Remove** from Address List: `/ip/firewall/address-list/remove` by searching for IP in `BLOCKED_USERS`.

## 4. Self-Healing (Reconciliation) [COMPLETED]
- **Target File**: `backend/workers/mikrotikSyncWorker.js` (`reconcileMikrotikState`)
- **Changes**:
    - [x] Verify DHCP lease existence for static users.
    - [x] Verify firewall address list state matches `isSuspended` status in DB.

## 5. Frontend Updates [COMPLETED]
- **Target File**: `frontend/src/app/mikrotik/users/new/page.tsx`
    - [x] Add `macAddress` input field.
    - [x] Update state and submission logic.
- **Target File**: `frontend/src/app/mikrotik/users/[id]/page.tsx`
    - [x] Add `macAddress` input field.
    - [x] Update state and submission logic.

## 6. Infrastructure Pre-requisite
- **Requirement**: Each MikroTik router must have the following filter rule:
  ```bash
  /ip firewall filter add action=drop chain=forward src-address-list=BLOCKED_USERS comment="IMSys: Drop expired clients"
  ```
- **Future Improvement**: This rule can be automatically provisioned if not present.

## 7. Cleanup [COMPLETED]
- Verified no legacy "1k/1k" references in backend logic.
- Confirmed "disabled=yes" is only used for PPPoE secrets.
