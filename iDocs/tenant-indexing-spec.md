# Specification: Multi-Tenancy Performance and Scalability Enhancement

## 1. Introduction & Goal

**Goal:** To significantly improve the performance and scalability of the application by implementing database indexes on the `tenant` field across all relevant data models.

This is a critical step to ensure the application remains fast and responsive as the number of tenants and the volume of data grows. It addresses a potential major performance bottleneck inherent in multi-tenant architectures.

---

## 2. The Problem: Inefficient Data Retrieval

Currently, most data models in the application are correctly segregated by a `tenant` field, which is excellent for data isolation. However, the database lacks a direct, efficient way to look up data for a specific tenant.

When a query like `find({ tenant: 'some-tenant-id' })` is executed, the database must perform a **full collection scan**. It sequentially reads every single document in the collection and compares its `tenant` field to the provided ID.

This is analogous to searching for a topic in a book without an index page—you have to read every page. While this works for a small number of documents, it becomes extremely slow and resource-intensive as the collection grows, leading to poor application performance.

---

## 3. The Solution: Database Indexing

The solution is to create a **database index** on the `tenant` field for every model that contains it.

An index is a special, sorted data structure that maps the `tenant` IDs to the physical location of the documents on disk. When an index is present, the database can use it to instantly find all documents belonging to a specific tenant without scanning the entire collection.

**The Change:**

For each affected Mongoose schema, we will add the following line:

```javascript
// For a schema named 'MyModelSchema'
MyModelSchema.index({ tenant: 1 });
```

This simple addition instructs Mongoose to ensure an index on the `tenant` field exists in the corresponding MongoDB collection.

---

## 4. Affected Models

The following model files have been identified as containing a `tenant` field and requiring an index to optimize tenant-specific queries.

**Models to be updated:**

*   `backend/models/DailyTransaction.js`
*   `backend/models/Device.js`
*   `backend/models/DiagnosticLog.js`
*   `backend/models/DowntimeLog.js`
*   `backend/models/Expense.js`
*   `backend/models/ExpenseType.js`
*   `backend/models/HotspotPlan.js`
*   `backend/models/HotspotTransaction.js`
*   `backend/models/HotspotUser.js`
*   `backend/models/Lead.js`
*   `backend/models/MikrotikRouter.js`
*   `backend/models/MikrotikUser.js`
*   `backend/models/MpesaAlert.js`
*   `backend/models/Notification.js`
*   `backend/models/Package.js`
*   `backend/models/SmsExpirySchedule.js`
*   `backend/models/SmsLog.js`
*   `backend/models/SmsProvider.js`
*   `backend/models/SmsTemplate.js`
*   `backend/models/StkRequest.js`
*   `backend/models/Subscription.js`
*   `backend/models/TechnicianActivity.js`
*   `backend/models/Ticket.js`
*   `backend/models/Transaction.js`
*   `backend/models/UserDowntimeLog.js`
*   `backend/models/Voucher.js`
*   `backend/models/WalletTransaction.js`
*   `backend/models/WhatsAppLog.js`
*   `backend/models/WhatsAppProvider.js`
*   `backend/models/WhatsAppTemplate.js`

**Models Already Indexed (No Action Needed):**

*   `backend/models/ApplicationSettings.js` (has a unique index)
*   `backend/models/Bill.js` (has a compound index including `tenant`)
*   `backend/models/ScheduledTask.js` (has a compound index including `tenant`)
*   `backend/models/SmsAcknowledgement.js` (has a compound index including `tenant`)
*   `backend/models/User.js` (The `tenant` field is on almost every user, indexing it might not be as beneficial as on other models, but can be considered later if performance issues arise).
*   `backend/models/Tenant.js` (This is the parent model, no `tenant` field).

---

## 5. Implementation Plan

We will proceed by editing each file listed in the "Models to be updated" section, adding the `MyModelSchema.index({ tenant: 1 });` line just before the model is exported. We will tackle them one by one to ensure a controlled and verifiable process.
