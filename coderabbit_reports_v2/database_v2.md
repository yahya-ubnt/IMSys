# CodeRabbit Review Report v2: Database & Schema
Date: 2026-02-03
Status: ⚠️ Issues Identified (Critical Gaps)

## Summary of Audit
The database schema is largely designed for multi-tenancy, but a deep-dive revealed specific models where isolation is missing, which could lead to data leakage or reconciliation errors.

## Analysis of Issues

### 🔴 Critical Issues
- **Missing Tenant Isolation in `MpesaTransaction.js`**: **CRITICAL**. This model stores payment records but lacks a `tenant` field. This means queries for M-Pesa transactions are likely fetching all records across the entire system, or relying on indirect links which is error-prone.
- **Missing Tenant Isolation in `TrafficLog.js`**: **HIGH**. Data usage logs are missing a direct `tenant` reference. While they link to a user, reporting and data retention policies for specific tenants are difficult to enforce without this field.
- **Empty `Report.js` Model**: The file exists but is empty. Any logic relying on this model will fail.

### 🛡️ Security & Integrity
- **Seeder Credentials**: `backend/seeder.js` contains hardcoded "production-like" passwords. While useful for dev, it presents a risk if accidental runs occur in staging/prod environments.
  *NOTE: This suggestion has not yet been addressed.*
- **Bcrypt Reliance**: The seeder passes plain text passwords. This relies entirely on the `User` model's `pre('save')` hook. Direct database insertions (like `insertMany`) would bypass this and store plain text passwords.

### 🟡 Suggestions & Improvements
- **Uniform Indexing**: Ensure all `tenant` fields have `index: true` for performance as the database grows.
- **Global Schema Base**: Consider creating a base schema or a mongoose plugin that automatically adds the `tenant` field and required validation to all models to prevent future omissions.

## Conclusion
The core models (Bill, User, Package) are well-structured, but the gaps in payment and log models are a significant risk to multi-tenancy. These must be addressed before the system is considered "production-ready" for multiple tenants.
