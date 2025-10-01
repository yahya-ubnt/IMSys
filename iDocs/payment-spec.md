# Payments Module Specification

This document outlines the specification for the Payments module, which provides tools for viewing and managing financial transactions.

## 1. Overview

The Payments module will centralize payment-related operations. It will provide a detailed log of all transactions, a page to initiate STK Pushes, a tool for recording manual cash payments, and a ledger for customer wallets.

## 2. Sidebar Navigation

The main sidebar will be updated to include a new collapsible "Payments" group.

-   **Payments** (Collapsible Menu Item, Icon: `CreditCard`)
    -   **Transaction Log** (Link to `/payments/transactions`)
    -   **Wallet Transactions** (Link to `/payments/wallet-transactions`)
    -   **Cash Purchase** (Link to `/payments/cash-purchase`)
    -   **STK Push** (Link to `/payments/stk-push`)

## 3. Data Model (Transaction)

This model records *external* payments coming into the system.

**File to Update:** `backend/models/MpesaTransaction.js` (should be renamed to `Transaction.js`)

**Schema:**
```javascript
{
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  referenceNumber: { type: String, required: true }, // User's account number
  officialName: { type: String, required: true }, // Name from M-Pesa or User Record
  msisdn: { type: String, required: true }, // Customer's phone number
  transactionDate: { type: Date, required: true },
  paymentMethod: { type: String, required: true, enum: ['M-Pesa', 'Cash'] },
  balance: { type: Number, required: false }, // Paybill balance, only for M-Pesa C2B
  comment: { type: String, required: false } // Optional comment for manual entries
}
```

## 4. Transaction Log Page

This page will provide a comprehensive log of all successful external transactions (both M-Pesa and Cash) received by the system.

-   **Backend API:** `GET /api/payments/transactions`
-   **Frontend URL:** `/payments/transactions`

## 5. Cash Purchase Page

This page allows an admin to manually record a cash payment for a user.

-   **Backend API:** `POST /api/payments/cash`
-   **Frontend URL:** `/payments/cash-purchase`

## 6. Wallet Transactions

This feature introduces an internal wallet for each customer to track credits and debits. The wallet transaction log serves as a detailed ledger for all value movements within a user's account.

### 6.1. Backend

#### 6.1.1. Data Model (`WalletTransaction`)

A new collection `wallet_transactions` will be created.

-   **New File:** `backend/models/WalletTransaction.js`
-   **Schema:**
    ```javascript
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikUser', required: true },
      transactionId: { type: String, required: true, unique: true }, // System-generated unique ID
      type: { type: String, required: true, enum: ['Credit', 'Debit', 'Adjustment'] },
      amount: { type: Number, required: true },
      source: { type: String, required: true }, // e.g., 'M-Pesa', 'Cash', 'Monthly Bill', 'HSP Purchase'
      balanceAfter: { type: Number, required: true },
      comment: { type: String },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin user who processed it
      createdAt: { type: Date, default: Date.now }
    }
    ```

#### 6.1.2. API Endpoints

-   **`GET /api/payments/wallet`**
    -   **Purpose:** List all wallet transactions.
    -   **Auth:** Protected.
    -   **Query Params:** `user` (filter by user ID), `type` (filter by type), `date` (filter by date range).

-   **`POST /api/payments/wallet`**
    -   **Purpose:** Record a new manual wallet transaction (e.g., an admin adjustment).
    -   **Auth:** Protected (Admin only).

-   **`GET /api/payments/wallet/:id`**
    -   **Purpose:** Fetch details of a specific wallet transaction.
    -   **Auth:** Protected.

#### 6.1.3. Integration with Payment Flows

The existing payment logic must be updated:
-   After any successful **M-Pesa** or **Cash** payment is recorded, a corresponding **Credit** transaction must be created in the `wallet_transactions` collection for the user.
-   A new model for the `MikrotikUser` will be needed to store the current `walletBalance`.

### 6.2. Frontend

-   **URL:** `/payments/wallet-transactions`
-   **UI:** A data table to display the wallet transaction ledger.
-   **Table Columns:**
    1.  **S/N:** Row number.
    2.  **User:** Customer name (`userId` populated).
    3.  **Transaction ID:** `transactionId`.
    4.  **Type:** `type` (Credit/Debit/Adjustment).
    5.  **Amount:** `amount`.
    6.  **Source/Reason:** `source`.
    7.  **Balance After:** `balanceAfter`.
    8.  **Date/Time:** `createdAt`.
    9.  **Comment:** `comment`.

## 7. STK Push Page

This page will be moved to `/payments/stk-push` to fit within the new module structure. All existing functionality will be preserved.
