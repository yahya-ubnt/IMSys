# BullMQ Migration & Atomicity Checklist

This document tracks the progress of migrating the system's hardware interaction logic to a robust, BullMQ-based queue system to ensure atomicity and eventual consistency.

## Phase 1: Foundational Setup

- [x] **Infrastructure: Add Redis to `docker-compose.yml`**
- [x] **Models: Add `syncStatus` and related fields to `MikrotikUser` model**
- [x] **Dependency: Install `bullmq` npm package**
- [x] **Project Structure: Create `backend/queues` and `backend/workers` directories**
- [x] **Queue Initialization: Set up the main `mikrotik-sync` queue**

## Phase 2: Controller & Logic Refactoring

- [x] **Refactor `createMikrotikUser`:**
    - [x] Update DB with `syncStatus: 'pending'`
    - [x] Push `addUser` job to the `mikrotik-sync` queue
- [x] **Refactor `updateMikrotikUser` (Package Change):**
    - [x] Set `pendingPackage` and `syncStatus: 'pending'`
    - [x] Push `updateUserPackage` job to the `mikrotik-sync` queue
- [x] **Refactor `suspendMikrotikUser` (Manual Disconnect):**
    - [x] Update DB with `isSuspended: true` and `syncStatus: 'pending'`
    - [x] Push `disconnectUser` job to the `mikrotik-sync` queue
- [x] **Refactor `manualConnectUser`:**
    - [x] Update DB with `isSuspended: false` and `syncStatus: 'pending'`
    - [x] Push `connectUser` job to the `mikrotik-sync` queue
- [x] **Refactor Cron Scripts (`disconnectExpiredClients.js`):**
    - [x] Convert script to a repeatable BullMQ job
    - [x] The job should query for expired users and push `disconnectUser` jobs to the queue

## Phase 3: Worker Implementation

- [x] **Create `mikrotikSyncWorker.js`**
- [x] **Implement `addUser` job processor**
- [x] **Implement `updateUserPackage` job processor**
- [x] **Implement `disconnectUser` job processor**
- [x] **Implement `connectUser` job processor**
- [x] **Implement error handling and `syncStatus` updates (`synced`, `error`)**
- [x] **Setup Worker Process (backend/worker.js, package.json, docker-compose.yml)**

## Phase 4: Reconciliation & Safety Nets

- [x] **Implement Reconciliation Scheduler (Expired Clients):**
    - [x] Create a repeatable job that runs daily (e.g., `scheduleExpiredClientDisconnects`)
    - [x] The job should find active tenants and push `processExpiredClientsForTenant` jobs to the queue
- [x] **Implement Full Reconciliation Worker (DB vs. Router):**
    - [x] Fetch all active users from MikroTik.
    - [x] Fetch all active users from MongoDB.
    - [x] Identify discrepancies (e.g., User exists in DB but not on Router).
    - [x] Auto-correct the state.

## Phase 5: Frontend UI/UX

- [ ] **Update UI to show "Pending" / "Syncing..." states for users**
- [ ] **Provide a "Retry" mechanism or display error messages from `syncErrorMessage`**
