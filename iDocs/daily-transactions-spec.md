# Expenses Module Specification

## 1. Module Overview

The The Expenses module will allow users to record, track, and manage business expenses within the CRM system. It will provide a dedicated interface for entering expense details, viewing a list of all recorded expenses, and performing CRUD (Create, Read, Update, Delete) operations on individual expense entries. The module will integrate seamlessly with the existing CRM structure, including a new sidebar navigation item.

## 2. Database Schema (MongoDB)

The `Expense` document will adhere to the following MongoDB schema:

```javascript
{
  _id: ObjectId,             // Unique identifier for the expense
  date: Date,                // The date the expense occurred (default: today, editable)
  amount: Number,            // The monetary amount of the expense
  method: String,            // Payment method: "M-Pesa", "Bank", "Cash"
  transactionMessage: String, // Full M-Pesa or Bank SMS message (can be long)
  description: String,       // Short free text description of the expense
  label: String,             // Category/Label for the expense (e.g., "Rent", "Salary", "Airtime", "Equipment")
  createdAt: Date,           // Timestamp of when the expense record was created
  updatedAt: Date            // Timestamp of when the expense record was last updated
}
```

## 3. Backend API Endpoints

The backend will expose RESTful API endpoints for managing expenses. These endpoints will be secured using existing authentication and authorization middleware.

### Base Path: `/api/expenses`

#### 3.1. Create Expense
- **Endpoint:** `POST /api/expenses`
- **Description:** Creates a new expense record.
- **Request Body:**
  ```json
  {
    "date": "YYYY-MM-DD",
    "amount": 123.45,
    "method": "M-Pesa",
    "transactionMessage": "Full M-Pesa or Bank SMS text...",
    "description": "Short description",
    "label": "Airtime"
  }
  ```
- **Response:** `201 Created` with the new expense object.

#### 3.2. Get All Expenses
- **Endpoint:** `GET /api/expenses`
- **Description:** Retrieves a list of all expense records. Supports filtering and searching.
- **Query Parameters:**
  - `startDate`: (Optional) Filter expenses from this date onwards.
  - `endDate`: (Optional) Filter expenses up to this date.
  - `method`: (Optional) Filter by payment method (e.g., "M-Pesa").
  - `label`: (Optional) Filter by expense label.
  - `search`: (Optional) Search term for `description` or `transactionMessage`.
- **Response:** `200 OK` with an array of expense objects.

#### 3.3. Get Single Expense by ID
- **Endpoint:** `GET /api/expenses/:id`
- **Description:** Retrieves a single expense record by its ID.
- **Response:** `200 OK` with the expense object, or `404 Not Found`.

#### 3.4. Update Expense
- **Endpoint:** `PUT /api/expenses/:id`
- **Description:** Updates an existing expense record.
- **Request Body:** (Partial update allowed)
  ```json
  {
    "date": "YYYY-MM-DD",
    "amount": 123.45,
    "method": "Bank",
    "description": "Updated description"
  }
  ```
- **Response:** `200 OK` with the updated expense object, or `404 Not Found`.

#### 3.5. Delete Expense
- **Endpoint:** `DELETE /api/expenses/:id`
- **Description:** Deletes an expense record by its ID.
- **Response:** `204 No Content` on successful deletion, or `404 Not Found`.

## 4. Frontend Components

### 4.1. Sidebar Integration

- A new navigation item labeled "Expenses" will be added to the main application sidebar (`frontend/src/components/app-sidebar.tsx`).
- Clicking this item will navigate to the `/expenses` route.
- The icon for the sidebar item should be relevant to expenses (e.g., a dollar sign, receipt icon).

### 4.2. Expenses List/Table View (`/expenses`)

- This page will display all recorded expenses in a tabular format, similar to existing data tables in the CRM.
- **Columns:** Date, Amount, Method, Label, Description, Actions.
- **Actions Column:** Will include buttons/dropdown for "View Details", "Edit", and "Delete" for each expense.
- **Expandable Rows:** Each row will be expandable to reveal the full `transactionMessage` content, which might be lengthy.
- **Filtering UI:**
  - Date Range Picker: For filtering by `date`.
  - Dropdown for Payment Method: "M-Pesa", "Bank", "Cash".
  - Dropdown/Input for Label/Category.
- **Search Bar:** A search input for `description` or `transactionMessage`.
- **"Add New Expense" Button:** A prominent button to navigate to the expense creation form (`/expenses/new`).

### 4.2.1. Dashboard

The "Daily Transactions" list view will include a dashboard at the top of the page. The dashboard will display the following statistics:

*   **Today's Transactions:** The total amount of all transactions for the current day.
*   **This Week's Transactions:** The total amount of all transactions for the current week (from Monday to Sunday).
*   **This Month's Transactions:** The total amount of all transactions for the current month.
*   **This Year's Transactions:** The total amount of all transactions for the current year.

The dashboard will be displayed as a set of cards, each showing one of the statistics.

The backend will need to be updated to provide the data for the dashboard. A new API endpoint will be created to fetch the dashboard data.

#### 4.2.1.1. Get Dashboard Stats
- **Endpoint:** `GET /api/daily-transactions/stats`
- **Description:** Retrieves the dashboard statistics.
- **Response:** `200 OK` with an object containing the dashboard data.
  ```json
  {
    "today": 123.45,
    "thisWeek": 1234.56,
    "thisMonth": 12345.67,
    "thisYear": 123456.78
  }
  ```

### 4.2.2. Monthly Transaction Trends Chart

The "Daily Transactions" list view will include an area chart displaying the total transaction amount for each month from January to December. The user will be able to select the year for which to display the data.

*   **Chart Type:** Area Chart
*   **Data Points:** Monthly total transaction amounts.
*   **X-axis:** Months (January to December).
*   **Y-axis:** Total Transaction Amount.
*   **Year Selection:** A dropdown or input field to select the year.

The backend will need to be updated to provide the data for this chart. A new API endpoint will be created to fetch the monthly transaction totals for a given year.

#### 4.2.2.1. Get Monthly Transaction Totals
- **Endpoint:** `GET /api/daily-transactions/monthly-totals`
- **Description:** Retrieves monthly transaction totals for a specified year.
- **Query Parameters:**
  - `year`: (Required) The year for which to retrieve monthly totals (e.g., `2023`).
- **Response:** `200 OK` with an array of objects, each representing a month's total.
  ```json
  [
    { "month": 1, "total": 1500.00 },
    { "month": 2, "total": 2000.50 },
    // ... up to month 12
  ]
  ```

### 4.3. Expense Form (Add/Edit) (`/expenses/new` and `/expenses/:id/edit`)

- A form for creating new expenses and editing existing ones.
- **Fields:**
  - **Date:** Date picker component (default to today's date for new entries).
  - **Amount:** Numeric input field.
  - **Payment Method:** Dropdown with options: "M-Pesa", "Bank", "Cash".
  - **Transaction Message:** Textarea for pasting SMS/Bank messages.
  - **Description:** Short text input.
  - **Label/Category:** Input field with suggestions or a dropdown for common categories (e.g., "Rent", "Salary", "Airtime", "Equipment"). This could evolve into a dynamic tag input.
- **Validation:** Client-side validation for required fields and data types.
- **Submission:** "Save" button for new entries, "Update" button for edits.
- **Cancellation:** "Cancel" button to return to the expenses list.

### 4.4. Expense Details View (`/expenses/:id`)

- A dedicated page to display all details of a single expense, including the full `transactionMessage`.
- Will include "Edit" and "Delete" buttons.

## 5. UI/UX Considerations

- **Consistency:** The new module's UI will adhere to the existing design system, using components from `@/components/ui` and maintaining the current styling (e.g., card layouts, button styles, typography).
- **Responsiveness:** All components will be designed to be responsive across different screen sizes.
- **User Feedback:** Provide clear loading indicators, success messages (toasts), and error messages for all operations.
- **Accessibility:** Ensure form fields are properly labeled and accessible.

## 6. Implementation Steps (High-Level)

1.  **Backend Development:**
    - Create `backend/models/Expense.js` based on the schema.
    - Create `backend/controllers/expenseController.js` with CRUD logic.
    - Create `backend/routes/expenseRoutes.js` to define API endpoints.
    - Integrate routes into `backend/server.js`.
2.  **Frontend Development:**
    - Add "Expenses" to `frontend/src/components/app-sidebar.tsx`.
    - Create new pages under `frontend/src/app/expenses/`:
        - `page.tsx` (List View)
        - `new/page.tsx` (Add Form)
        - `[id]/page.tsx` (Details View)
        - `[id]/edit/page.tsx` (Edit Form)
    - Create `frontend/src/lib/expenseService.ts` for API interactions.
    - Define columns in `frontend/src/app/expenses/columns.tsx` for the data table.
    - Develop form components and integrate filtering/search logic.

