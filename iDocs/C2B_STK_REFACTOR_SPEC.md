
# C2B and STK Payment Integration Refactoring Specification

## 1. Introduction

This document outlines the specification for refactoring the M-Pesa C2B (Customer-to-Business) and STK (SIM Toolkit) Push payment integration. The current implementation provides basic functionality for processing payments but has significant gaps in testing, security, and robustness. This refactoring aims to address these issues to create a secure, reliable, and maintainable payment system.

## 2. Current Implementation Analysis

The current payment processing system is distributed across several services and controllers.

### 2.1. Key Components

- **`hotspotStkController.js`**: Initiates STK push for hotspot users and handles the callback.
- **`mpesaService.js`**: The core service for interacting with the Safaricom Daraja API. It handles:
    - STK push initiation (`initiateStkPushService`).
    - STK callback processing (`processStkCallback`).
    - C2B callback processing (`processC2bCallback`).
    - C2B callback URL registration (`registerCallbackURL`).
- **`paymentService.js`**: The central service for handling successful payments from any source. Its `handleSuccessfulPayment` function is the entry point for processing all payments.
- **`MikrotikUser` Model**: Represents PPPoE and static users, and contains the `mPesaRefNo` used for C2B payments.

### 2.2. Payment Flows

#### 2.2.1. STK Push Flow (Hotspot)

1.  The user initiates a payment from the hotspot portal.
2.  `hotspotStkController.initiateStkPush` is called.
3.  `mpesaService.initiateStkPushService` sends a request to the Daraja API.
4.  The user receives an STK push on their phone and enters their PIN.
5.  Daraja sends a callback to the `/api/v1/webhooks/stk-callback` endpoint.
6.  `mpesaService.processStkCallback` handles the callback, and for `HOTSPOT` type, it updates the hotspot session.

#### 2.2.2. C2B Flow (PPPoE/Static Users)

1.  The user is assigned a unique `mPesaRefNo` (stored in the `MikrotikUser` model).
2.  The user pays via the M-Pesa SIM toolkit, using the `mPesaRefNo` as the account number.
3.  Daraja sends a callback to the `/api/v1/webhooks/c2b-callback` endpoint.
4.  `mpesaService.processC2bCallback` handles the callback.
5.  `paymentService.handleSuccessfulPayment` is called.
6.  The service finds the user by matching the `mPesaRefNo` with the `BillRefNumber` from the callback.
7.  `paymentService.processSubscriptionPayment` is called to renew the user's account.

## 3. Identified Issues and Risks

The current implementation has several critical issues that expose the system to financial loss, data integrity problems, and security breaches.

### 3.1. Lack of Comprehensive Testing

This is the most severe issue.

- **`paymentService.js`**: The core `handleSuccessfulPayment` and `processSubscriptionPayment` functions are **completely untested**. This means there is no automated way to verify that payments are processed correctly.
- **`mpesaService.js`**: Tests only cover the "happy path". There are no tests for:
    - API errors from Daraja.
    - Database failures.
    - Invalid or malicious callback data.
    - Duplicate transaction processing.
    - The `HOTSPOT` payment logic.

**Risk**: High risk of bugs, regressions, and financial discrepancies. Any changes to the payment logic are dangerous without a test suite.

### 3.2. Security Vulnerabilities

- **Insecure Credential Storage**: M-Pesa credentials (consumer key, secret, passkey) are stored in the `ApplicationSettings` collection in the database. This is a major security risk. If the database is compromised, the credentials can be stolen.
- **Insecure Callback URLs**: The callback endpoints are public and not secured. An attacker could potentially send fake callbacks to the system, although the risk is mitigated by the fact that the system checks for existing transaction IDs.

**Risk**: High risk of financial fraud and reputational damage if credentials are stolen.

### 3.3. No Transaction Reconciliation

There is no automated process to compare the transaction records in the IMSys database with the official M-Pesa statements.

**Risk**: Medium risk of financial discrepancies going unnoticed. It is difficult to identify and resolve issues like missed callbacks, duplicate processing, or incorrect amounts.

## 4. Refactoring Goals

- **Improve Reliability**: Ensure that all payments are processed correctly and consistently.
- **Enhance Security**: Protect sensitive M-Pesa credentials and secure the callback endpoints.
- **Increase Maintainability**: Make the code easier to understand, test, and modify.
- **Provide Confidence**: Give the business confidence that the payment system is secure and reliable.

## 5. Proposed Refactoring

### 5.1. Phase 1: Comprehensive Testing

This is the highest priority. No other refactoring should be done until a comprehensive test suite is in place.

#### 5.1.1. `paymentService.js` Test Plan

- **Unit Tests for `handleSuccessfulPayment`**:
    - Test payment for an invoice.
    - Test payment for a user via `mPesaRefNo`.
    - Test payment for a user via `_id` (cash payment).
    - Test payment for a non-existent user.
    - Test payment for an already-paid invoice.
    - Test what happens when `processSubscriptionPayment` throws an error.
    - Test the atomicity of the database transaction (ensure `abortTransaction` is called on error).
- **Unit Tests for `processSubscriptionPayment`**:
    - Test renewal for an active user.
    - Test renewal for an expired user.
    - Test renewal for a user with a grace period.
    - Test what happens when the Mikrotik API call fails.

#### 5.1.2. `mpesaService.js` Test Plan

- **Error Handling Tests**:
    - Test how the system handles a 500 error from the Daraja API.
    - Test how the system handles a 4xx error from the Daraja API.
    - Test how the system handles a database connection failure.
- **Callback Validation Tests**:
    - Test a callback with a missing `ResultCode`.
    - Test a callback with a non-zero `ResultCode`.
    - Test a callback with a missing `MpesaReceiptNumber`.
    - Test a callback for a transaction that has already been processed.
- **Hotspot Logic Tests**:
    - Test the successful processing of a `HOTSPOT` payment.
    - Test the case where the `HotspotPlan` is not found.
    - Test the case where the Mikrotik API call to `addHotspotIpBinding` fails.

### 5.2. Phase 2: Security Enhancements

- **Secure Credential Storage**:
    - Integrate a secret management system like HashiCorp Vault or AWS Secrets Manager.
    - The `getTenantMpesaCredentials` function should be updated to retrieve credentials from the secret manager instead of the database.
    - Create a secure process for adding and updating credentials in the secret manager.
- **Secure Callback URLs**:
    - Add a unique, randomly generated token to the callback URL for each tenant.
    - The callback handler should validate this token before processing the callback.
    - The token should be stored securely along with the other M-Pesa credentials.

### 5.3. Phase 3: Transaction Reconciliation

- **Create a Reconciliation Job**:
    - Create a new scheduled job (e.g., `reconciliationJob.js`) that runs daily.
    - This job will fetch the M-Pesa statement for the previous day using the Daraja API (or a file-based import if the API is not available).
    - The job will compare the transactions in the M-Pesa statement with the transactions in the `Transaction` collection.
- **Create a Reconciliation Report**:
    - The job will generate a report that highlights any discrepancies:
        - Transactions in the M-Pesa statement but not in the IMSys database.
        - Transactions in the IMSys database but not in the M-Pesa statement.
        - Transactions with mismatched amounts.
- **Create a Reconciliation UI**:
    - Create a new UI where an administrator can view the reconciliation reports and manually resolve any discrepancies.

## 6. Acceptance Criteria

The refactoring will be considered complete when:

- The test coverage for `paymentService.js` and `mpesaService.js` is above 90%.
- All M-Pesa credentials are stored in a secure secret management system.
- All callback URLs are secured with a unique token.
- The automated transaction reconciliation job is running daily and generating accurate reports.
- All existing payment functionality works as expected.
- The system is stable and has been running in a staging environment for at least one week without any payment-related errors.
