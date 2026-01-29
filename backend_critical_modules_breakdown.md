# Backend Critical Modules Breakdown

## 1. Finance System (Critical)
This module handles all revenue, payments, invoicing, and transactions. It is the most critical part of the system as it deals with monetary value and external payment gateways (M-Pesa).

### Controllers
- `backend/controllers/paymentController.js`: Main entry point for payments.
- `backend/controllers/billController.js`: Manages user bills.
- `backend/controllers/invoiceController.js`: Generates and manages invoices.
- `backend/controllers/transactionController.js`: General transaction history.
- `backend/controllers/dailyTransactionController.js`: Daily financial aggregation.
- `backend/controllers/collectionController.js`: Revenue collection analytics.
- `backend/controllers/expenseController.js`: Expense tracking.
- `backend/controllers/expenseTypeController.js`: Categories for expenses.

### Models
- `backend/models/Bill.js`
- `backend/models/Invoice.js`
- `backend/models/Transaction.js`
- `backend/models/DailyTransaction.js`
- `backend/models/WalletTransaction.js`
- `backend/models/MpesaTransaction.js`
- `backend/models/MpesaAlert.js`
- `backend/models/Expense.js`
- `backend/models/ExpenseType.js`
- `backend/models/HotspotTransaction.js`

### Routes
- `backend/routes/paymentRoutes.js`
- `backend/routes/publicPaymentRoutes.js`
- `backend/routes/billRoutes.js`
- `backend/routes/invoiceRoutes.js`
- `backend/routes/transactionRoutes.js`
- `backend/routes/dailyTransactionRoutes.js`
- `backend/routes/collectionRoutes.js`
- `backend/routes/expenseRoutes.js`
- `backend/routes/expenseTypeRoutes.js`

### Services & Utilities (Deep Dependencies)
- `backend/services/mpesaService.js`: Core logic for interacting with Safaricom Daraja API.
- `backend/utils/paymentProcessing.js`: Business logic for applying payments to user accounts (renewals, wallet credits).
- `backend/utils/darajaAuth.js`: Authentication helper for M-Pesa.
- `backend/utils/crypto.js`: Encryption for sensitive data (likely used for keys).

---

## 2. Core Infrastructure & Auth
These modules underpin the entire system.

### Auth
- `backend/middlewares/authMiddleware.js`: JWT verification and tenant context.
- `backend/middlewares/protect.js`: Alternative/Legacy auth middleware (needs unification).
- `backend/models/User.js`: User accounts (Technicians, Admins).

### Configuration
- `backend/config/db.js`: Database connection.
- `backend/models/ApplicationSettings.js`: Stores critical config like M-Pesa keys and SMTP settings.
- `backend/models/Tenant.js`: Multi-tenancy root object.

---

## 3. Network Management (Mikrotik)
Controls the actual internet access hardware.

- `backend/controllers/mikrotikRouterController.js`
- `backend/controllers/mikrotikUserController.js`
- `backend/services/routerMonitoringService.js`
- `backend/utils/mikrotikUtils.js`

## 4. Messaging & Notifications
- `backend/controllers/smsController.js`
- `backend/services/smsService.js`
- `backend/services/emailService.js`
