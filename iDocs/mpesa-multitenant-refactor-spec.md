# Refactoring Plan: Multi-Tenant M-Pesa Integration

## 1. Objective

To refactor the M-Pesa integration to be truly multi-tenant. The goal is to ensure that every M-Pesa API call (like an STK Push) is performed using the specific credentials configured by each individual tenant, rather than a single global key.

## 2. Current State (The Problem)

The current implementation has a critical architectural flaw. The `darajaAuth.js` utility, which is responsible for getting an authentication token from Safaricom's Daraja API, reads the M-Pesa `consumerKey` and `consumerSecret` directly from the global `.env` file.

This means that regardless of what credentials a tenant enters in their settings, the system **always** uses the central keys from the `.env` file for all M-Pesa operations. This completely bypasses the multi-tenant settings in the database.

## 3. Proposed State (The Solution)

We will refactor the M-Pesa authentication logic to be centralized and "tenant-aware."

1.  The core authentication utility (`darajaAuth.js`) will be modified to require a `tenantId` for every operation.
2.  It will use this `tenantId` to fetch that tenant's specific, encrypted M-Pesa credentials from the `ApplicationSettings` in the database.
3.  It will use only those credentials to communicate with the Daraja API.
4.  The global M-Pesa keys in the `.env` file will become obsolete and will be removed.

This ensures strict data and transaction isolation between tenants, which is essential for a SaaS application.

## 4. Execution Plan

- [ ] **Step 1: Refactor `darajaAuth.js`**
  - [ ] Modify the `getDarajaToken` function to accept a `tenantId` as an argument: `getDarajaToken(tenantId)`.
  - [ ] Remove the use of global environment variables for M-Pesa keys.
  - [ ] Add logic to fetch the `ApplicationSettings` for the given `tenantId`.
  - [ ] Use the decrypted credentials from the fetched settings to get an M-Pesa token.
  - [ ] Remove the global token caching, as tokens may differ per tenant.

- [ ] **Step 2: Refactor `mpesaService.js`**
  - [ ] This file already contains some correct tenant-aware logic. We will streamline it.
  - [ ] Update functions like `initiateStkPushService` to use the new, refactored `getDarajaToken(tenantId)` from `darajaAuth.js`.
  - [ ] Remove any duplicate or conflicting authentication logic from this service file to centralize authentication in `darajaAuth.js`.

- [ ] **Step 3: Clean Up Configuration**
  - [ ] After the code refactor is complete and verified, remove the now-obsolete `DARAJA_*` variables from the root `.env` file to eliminate confusion.

- [ ] **Step 4: Verification**
  - [ ] Test the M-Pesa STK push functionality.
  - [ ] Confirm that it uses the credentials configured in the UI for a specific tenant.
  - [ ] Confirm that the functionality continues to work after the keys are removed from the `.env` file.
