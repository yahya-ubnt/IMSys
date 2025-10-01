# Expenses Module Specification

This document outlines the specifications for the Expenses module, which includes two main sections: Expense Type and All Expenses.

## 1. Sidebar Navigation

The main sidebar should include a new menu item: "Expenses". When clicked, it should reveal two sub-menu items:
-   **Expense Type**
-   **All Expenses**

---

## 2. Expense Type

This section allows administrators to define and manage different categories of expenses.

### 2.1. Page Layout

-   When a user navigates to the "Expense Type" page, they will see a button labeled **"New Expense Type"**.
-   Below the button, a table will display all existing expense types.

### 2.2. Adding a New Expense Type

-   Clicking the **"New Expense Type"** button will open a modal or a form with the following fields:
    -   **Expense Type Title**: A text input field.
    -   **Expense Type Description**: A text area for a more detailed description.
-   **Buttons**:
    -   **"Add Expense Type"**: Submits the form and creates the new expense type.
    -   **"Close"**: Cancels the operation and closes the form/modal.

### 2.3. Expense Type Table

The table of expense types will have the following columns:

| Column      | Description                                     | Example                  |
| :---------- | :---------------------------------------------- | :----------------------- |
| **ID**      | A unique identifier for the expense type.       | 1, 2, 3                  |
| **Name**    | The title of the expense type.                  | "Office Supplies"        |
| **Detail**  | The description of the expense type.            | "Expenses for stationery"|
| **Date Added**| The timestamp when the expense type was created.| "2025-09-04 10:00 AM"    |
| **Added By**| The user who created the expense type.          | "admin@example.com"      |
| **Status**  | The status of the expense type.                 | `Active` / `Inactive`    |
| **Actions** | Buttons to perform actions on the row.          | `Update`, `Delete`       |

---

## 3. All Expenses

This section is for recording and viewing all individual expenses.

### 3.1. Page Layout

-   The "All Expenses" page will feature an **"Add New Expense"** button.
-   A table below the button will list all recorded expenses.

### 3.2. Adding a New Expense

-   Clicking the **"Add New Expense"** button will open a form with the following fields:
    -   **Expense Title**: A text input for the name of the expense.
    -   **Expense Amount**: A numerical input for the cost.
    -   **Expense Type**: A dropdown menu populated with the names of the expense types created in the "Expense Type" section.
    -   **Expense By**: A dropdown menu to select the user who incurred the expense (e.g., "admin@example.com").
    -   **Expense Description**: A text area for any relevant details.
    -   **Expense Date**: A date picker to select the date of the expense.
    -   **Expense Status**: A dropdown menu with options: `Due` or `Paid`.
-   **Buttons**:
    -   **"Add Expense"**: Submits the form to record the new expense.
    -   **"Close"**: Cancels the operation.

### 3.3. All Expenses Table

The table for all expenses will display the following columns, inferred from the creation form:

| Column        | Description                                  | Example                  |
| :------------ | :------------------------------------------- | :----------------------- |
| **ID**        | A unique identifier for the expense record.  | 1, 2, 3                  |
| **Title**     | The title of the expense.                    | "New Keyboard"           |
| **Amount**    | The cost of the expense.                     | "75.00"                  |
| **Expense Type**| The category of the expense.               | "Office Supplies"        |
| **Expense By**| The user who made the expense.               | "admin@example.com"      |
| **Description**| Additional details about the expense.      | "Mechanical keyboard"    |
| **Expense Date**| The date the expense was incurred.         | "2025-09-04"             |
| **Status**    | The payment status of the expense.           | `Due` / `Paid`           |
| **Actions**   | Buttons for actions like `Update`, `Delete`. | `Update`, `Delete`       |

---

## 4. Backend Specification

To support the frontend functionality, the following backend components must be created.

### 4.1. New Files

The following new files will need to be created in the `backend` directory:

-   **Models**:
    -   `models/ExpenseType.js`
    -   `models/Expense.js`
-   **Controllers**:
    -   `controllers/expenseTypeController.js`
    -   `controllers/expenseController.js`
-   **Routes**:
    -   `routes/expenseTypeRoutes.js`
    -   `routes/expenseRoutes.js`

### 4.2. Data Models

#### 4.2.1. ExpenseType Model (`models/ExpenseType.js`)

This model will store the different categories of expenses.

```javascript
const mongoose = require('mongoose');

const expenseTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseType = mongoose.model('ExpenseType', expenseTypeSchema);
module.exports = ExpenseType;
```

#### 4.2.2. Expense Model (`models/Expense.js`)

This model will store individual expense records.

```javascript
const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    expenseType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'ExpenseType',
    },
    expenseBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    description: {
      type: String,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Due', 'Paid'],
      default: 'Due',
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
```

### 4.3. API Endpoints

All endpoints should be protected and require authentication.

#### 4.3.1. Expense Type Routes (`/api/expensetypes`)

-   **`POST /`**: Create a new expense type.
    -   **Body**: `name`, `description`
    -   **Returns**: The newly created expense type object.
-   **`GET /`**: Get all expense types.
    -   **Returns**: An array of expense type objects.
-   **`GET /:id`**: Get a single expense type by its ID.
    -   **Returns**: A single expense type object.
-   **`PUT /:id`**: Update an expense type.
    -   **Body**: `name`, `description`, `status`
    -   **Returns**: The updated expense type object.
-   **`DELETE /:id`**: Delete an expense type.
    -   **Returns**: A success message.

#### 4.3.2. Expense Routes (`/api/expenses`)

-   **`POST /`**: Create a new expense.
    -   **Body**: `title`, `amount`, `expenseType`, `expenseBy`, `description`, `expenseDate`, `status`
    -   **Returns**: The newly created expense object.
-   **`GET /`**: Get all expenses.
    -   **Returns**: An array of all expense objects.
-   **`GET /:id`**: Get a single expense by its ID.
    -   **Returns**: A single expense object.
-   **`PUT /:id`**: Update an expense.
    -   **Body**: `title`, `amount`, `expenseType`, `expenseBy`, `description`, `expenseDate`, `status`
    -   **Returns**: The updated expense object.
-   **`DELETE /:id`**: Delete an expense.
    -   **Returns**: A success message.
