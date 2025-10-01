## Bills Module: System Design Specification

### 1. Overview

The Bills module will allow users to track recurring monthly bills, categorize them as "Personal" or "Company", record payments, and view historical data. It will integrate seamlessly into the existing CRM structure with new sidebar navigation and a consistent UI/UX.

### 2. Database Schema (MongoDB)

The provided schema is suitable for tracking individual bill instances for a given month/year.

```javascript
// backend/models/Bill.js
const mongoose = require('mongoose');

const BillSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Number, required: true, min: 1, max: 31 }, // Day of the month
    category: { type: String, required: true, enum: ['Personal', 'Company'] },
    status: { type: String, required: true, enum: ['Paid', 'Not Paid'], default: 'Not Paid' },
    paymentDate: { type: Date },
    method: { type: String, enum: ['M-Pesa', 'Bank', 'Cash'] },
    transactionMessage: { type: String },
    description: { type: String },
    month: { type: Number, required: true, min: 1, max: 12 }, // Month (1-12)
    year: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user who owns the bill
  },
  {
    timestamps: true,
  }
);

// Add a unique compound index to prevent duplicate bills for the same user, name, category, month, and year
BillSchema.index({ user: 1, name: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Bill', BillSchema);
```

**Note on Schema:**
*   Added `user` field to link bills to specific users, ensuring multi-tenancy.
*   Added a unique compound index to prevent duplicate entries for the same bill in a given month/year for a user.

### 3. Backend Design

#### 3.1. API Endpoints

All endpoints will be protected by authentication middleware (`protect`).

*   **`POST /api/bills`**: Create a new bill instance for the current month/year.
    *   **Request Body**: `{ name, amount, dueDate, category, description }`
    *   **Response**: Newly created bill object.
*   **`GET /api/bills`**: Get all bills for a specific month/year (defaults to current month/year).
    *   **Query Params**: `?month=<number>&year=<number>`
    *   **Response**: Array of bill objects.
*   **`GET /api/bills/:id`**: Get a single bill by ID.
    *   **Response**: Bill object.
*   **`PUT /api/bills/:id`**: Update a bill (e.g., mark as paid, update details).
    *   **Request Body**: `{ status, paymentDate, method, transactionMessage, description }` (partial update)
    *   **Response**: Updated bill object.
*   **`DELETE /api/bills/:id`**: Delete a bill instance.
    *   **Response**: Success message.

#### 3.2. Controllers (`backend/controllers/billController.js`)

*   **`createBill`**:
    *   Extract `name`, `amount`, `dueDate`, `category`, `description` from `req.body`.
    *   Get `month` and `year` from current date.
    *   Assign `req.user._id` as `user`.
    *   Create new `Bill` document.
    *   Handle duplicate bill creation for the same month/year/user/name/category.
*   **`getBills`**:
    *   Extract `month` and `year` from `req.query` (default to current month/year if not provided).
    *   Filter bills by `user` and `month`/`year`.
    *   Return sorted bills (e.g., by `dueDate`).
*   **`getBillById`**:
    *   Find bill by `id` and `user`.
*   **`updateBill`**:
    *   Find bill by `id` and `user`.
    *   Update fields like `status`, `paymentDate`, `method`, `transactionMessage`, `description`.
    *   Ensure `paymentDate` and `method` are only set if `status` is 'Paid'.
*   **`deleteBill`**:
    *   Find and delete bill by `id` and `user`.

#### 3.3. Routes (`backend/routes/billRoutes.js`)

*   Define routes and link to controller functions.
*   Apply `protect` middleware to all routes.

#### 3.4. Monthly Bill Reset Logic (Cron Job / Scheduled Task)

This is a critical component. At the start of each new month, all bills for the *previous* month need to be processed, and new "Not Paid" instances for the *current* month need to be generated based on the recurring bill definitions.

**Approach:**
1.  **Define Recurring Bills:** We need a way to define the *template* for recurring bills (e.g., "Rent" is always 10000, due on the 5th, Personal). The current `Bill` schema is for *instances*.
    *   **Option A (Simpler for now):** Assume that if a bill exists for the previous month, it's a recurring bill. When a new month starts, iterate through all unique `(user, name, amount, dueDate, category)` combinations from the *previous* month's bills. For each unique combination, create a new `Bill` instance for the *current* month with `status: 'Not Paid'`.
    *   **Option B (More Robust):** Introduce a separate `RecurringBill` schema.

    **Recommendation:** Start with **Option A** for simplicity, as it directly uses the existing `Bill` schema. If the user later needs to manage recurring bill templates separately (e.g., change amount for future months without affecting past), then Option B can be implemented.

2.  **Implementation:**
    *   **Scheduled Task:** Use a library like `node-cron` or a cloud-based scheduler (e.g., AWS Lambda, Google Cloud Functions) to run a daily or monthly job.
    *   **Job Logic:**
        *   Get the current date.
        *   If it's the first day of a new month:
            *   Get the previous month and year.
            *   Find all unique recurring bill definitions from the previous month's `Bill` documents (e.g., `Bill.aggregate([...])`).
            *   For each unique definition, check if a `Bill` instance already exists for the *current* month.
            *   If not, create a new `Bill` document for the current month with `status: 'Not Paid'`.
            *   Log the process.

### 4. Frontend Design

#### 4.1. Sidebar Navigation (`frontend/src/components/app-sidebar.tsx`)

*   Add a new top-level item for "BILLS" with an appropriate icon (e.g., `Receipt` or `Wallet`).
*   Under "BILLS", create two direct submenus:
    *   **Personal**: Navigates to "View All Personal Bills" (`/bills/personal`)
    *   **Company**: Navigates to "View All Company Bills" (`/bills/company`)

#### 4.2. Pages

*   **`frontend/src/app/bills/personal/new/page.tsx`**: Add New Personal Bill Form
    *   Input fields for Bill Name, Amount, Due Date, Description.
    *   Category will be pre-filled as "Personal".
    *   Submit button to call `createBill` API.
    *   Use existing UI components (Input, Label, Button, Card, etc.).
*   **`frontend/src/app/bills/company/new/page.tsx`**: Add New Company Bill Form
    *   Identical to Personal form, but Category pre-filled as "Company".
*   **`frontend/src/app/bills/personal/page.tsx`**: View All Personal Bills
    *   Table to display personal bills for the selected month/year.
    *   Month/Year filter (dropdowns or date picker).
    *   Color coding for status (Green for Paid, Red for Not Paid).
    *   Actions: "Mark as Paid" button (opens a modal/form), "Edit", "Delete".
    *   Use `DataTable` component for display.
*   **`frontend/src/app/bills/company/page.tsx`**: View All Company Bills
    *   Identical to Personal view, but filtered for "Company" bills.
*   **`frontend/src/app/bills/[id]/page.tsx`**: View Bill Details
    *   Read-only view of a single bill, matching the new expense details UI.
    *   Display all bill fields, including payment details if paid.
*   **`frontend/src/app/bills/[id]/edit/page.tsx`**: Edit Bill
    *   Form to edit bill details (name, amount, due date, description).
    *   Option to mark as paid, with fields for Payment Date, Method, Transaction Message, Description.

#### 4.3. Components

*   **`frontend/src/lib/billService.ts`**: API service functions (`createBill`, `getBills`, `getBillById`, `updateBill`, `deleteBill`) using `fetchApi` and handling token.
*   **`frontend/src/types/bill.d.ts`**: TypeScript type definition for the Bill schema.
*   **`frontend/src/app/bills/columns.tsx`**: Column definitions for the `DataTable` component, including custom cells for status color coding and actions.

### 5. Implementation Steps (High-Level)

1.  **Backend:**
    *   Create `backend/models/Bill.js` (Mongoose schema).
    *   Create `backend/controllers/billController.js` (API logic).
    *   Create `backend/routes/billRoutes.js` (API routes).
    *   Integrate `billRoutes` into `backend/server.js`.
    *   Implement the monthly bill reset logic (e.g., using `node-cron` in `server.js` or a separate script).
2.  **Frontend:**
    *   Create `frontend/src/types/bill.d.ts`.
    *   Create `frontend/src/lib/billService.ts`.
    *   Update `frontend/src/components/app-sidebar.tsx` for new navigation.
    *   Create new pages:
        *   `frontend/src/app/bills/personal/new/page.tsx`
        *   `frontend/src/app/bills/company/new/page.tsx`
        *   `frontend/src/app/bills/personal/page.tsx`
        *   `frontend/src/app/bills/company/page.tsx`
        *   `frontend/src/app/bills/[id]/page.tsx`
        *   `frontend/src/app/bills/[id]/edit/page.tsx`
    *   Create `frontend/src/app/bills/columns.tsx`.
