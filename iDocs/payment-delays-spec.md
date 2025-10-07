# Feature Spec: Delayed Payment Tracking & Analysis

## 1. Objective

To provide ISP administrators with a tool to identify, track, and analyze users who have delayed their monthly subscription payments. This will help in proactive customer follow-ups, reduce churn, and improve cash flow management.

## 2. User Stories

- As an administrator, I want to see a list of all users who are currently expired and have not renewed their subscription.
- As an administrator, I want to be able to filter this list to show only users who have been expired for a specific number of days (e.g., 3 days, 7 days, 10 days, 30 days).
- As an administrator, I want to view the details of a delayed user, including their name, contact information, package, and the exact number of days they are overdue.
- As an administrator, I want to click on a user from the delayed list and see their historical payment score/statistics to understand their payment behavior over time.

## 3. Functional Requirements

### Backend (API)

#### 3.1. Endpoint to list users with delayed payments

- **Endpoint:** `GET /api/users/delayed-payments`
- **Description:** Retrieves a list of Mikrotik users who are expired and whose payment is overdue by a certain number of days.
- **Query Parameters:**
  - `days_overdue` (Number, required): The minimum number of days the user's payment is overdue. The API should return users overdue by this many days or more.
- **Response (Success - 200 OK):**
  - An array of user objects. Each object will contain:
    ```json
    [
      {
        "userId": "string",
        "name": "string",
        "phone": "string",
        "mikrotikId": "string",
        "package": {
          "name": "string",
          "price": "number"
        },
        "lastBilledDate": "date",
        "expiryDate": "date",
        "daysOverdue": "number"
      }
    ]
    ```

#### 3.2. Endpoint for user payment statistics

- **Endpoint:** `GET /api/users/:id/payment-stats`
- **Description:** Retrieves detailed payment statistics for a single user.
- **URL Parameters:**
  - `id` (String, required): The ID of the user.
- **Response (Success - 200 OK):**
  - A JSON object containing payment statistics:
    ```json
    {
      "userId": "string",
      "name": "string",
      "totalPayments": "number",
      "onTimePayments": "number",
      "latePayments": "number",
      "onTimePaymentPercentage": "number", // (onTimePayments / totalPayments) * 100
      "averagePaymentDelay": "number", // in days, for late payments
      "lifetimeValue": "number", // Total amount paid by the user
      "paymentHistory": [
        {
          "billId": "string",
          "dueDate": "date",
          "paidDate": "date",
          "amount": "number",
          "status": "Paid (On-Time)" | "Paid (Late)"
        }
      ]
    }
    ```

### Frontend (UI)

- A new page accessible from the main navigation, titled "Delayed Payments" or "Overdue Subscribers".
- The page will feature:
  - An input field to enter the "Minimum Days Overdue".
  - A "Filter" button to fetch and display the data.
  - A data table to display the list of delayed users.
- The table will have the following columns:
  - User Name
  - Phone Number
  - Package Name
  - Package Price
  - Expiry Date
  - Days Overdue
  - Action (e.g., a "View Stats" button)
- Clicking the "View Stats" button will navigate the admin to a new page or open a modal displaying the detailed payment statistics for that user.

### Frontend (UI) Implementation Notes

- **Technology Stack:** The new page will be built using the existing frontend stack: Next.js, TypeScript, and Tailwind CSS.
- **Component Library:** We will utilize the established **Shadcn/UI** component library to ensure visual consistency.
- **Reusable Components:** The implementation will reuse existing components, including:
  - `DataTable` for displaying the list of overdue users.
  - `Card` for page structure and layout.
  - `Input` for the "Days Overdue" filter.
  - `Button` for actions.
- **Styling:** The new page will adhere to the existing dark theme and styling conventions (e.g., `bg-zinc-900`, `text-white`, etc.) found throughout the application.

## 4. Data Models Involved

This feature will primarily use existing data models:

- **`MikrotikUser`**: To get user details, status (active/expired), and package information. We will need to check the `status` and `expiration` fields.
- **`Bill`**: To find the due dates and payment status of each bill associated with a user.
- **`Transaction`**: To find the actual payment dates to compare against the due dates.
- **`Package`**: To get details about the user's subscription package.

No immediate changes to the data models are anticipated. The logic will be handled in the controllers and services by querying and combining data from these existing models.

## 5. Technical Implementation (High-Level)

- **Backend Logic for `GET /api/users/delayed-payments`:**
  1. The controller will receive the `days_overdue` query parameter.
  2. It will query the `MikrotikUser` model for users with `status: 'expired'`.
  3. For each expired user, it will calculate the number of days since their `expiration` date.
  4. It will filter this list to include only users where the calculated days are greater than or equal to `days_overdue`.
  5. It will populate necessary details (like package info) and return the final list.

- **Backend Logic for `GET /api/users/:id/payment-stats`:**
  1. Find the user by ID.
  2. Query all `Bill` records associated with this user.
  3. For each bill, find the corresponding `Transaction` to get the payment date.
  4. Calculate the difference between `paidDate` and `dueDate` for each bill to determine if it was late.
  5. Aggregate the data to compute the statistics (total payments, on-time percentage, average delay, etc.).
  6. Return the aggregated stats.

## 6. Future Enhancements

- **Automated Alerts:** Set up cron jobs to automatically send SMS or WhatsApp reminders to users on this list.
- **User Tagging:** Allow admins to tag users (e.g., "Good Payer," "Chronic Late Payer") based on their stats.
- **Dashboard Widget:** Add a widget to the main dashboard showing a summary of overdue payments (e.g., "5 users are 3+ days overdue").

## 7. In-Depth Logic for Payment Insights Page

This section details the step-by-step process of how the Payment Insights page generates its results, turning raw transaction data into a clear financial scorecard for each customer.

### The Goal: Answer Key Financial Questions

The primary purpose of this page is to answer these critical questions about a customer at a glance:
- Are they a reliable payer?
- When they are late, how late are they on average?
- What is their total value to the business so far?
- What is the detailed history of their bills and payments?

### Step 1: Fetching the Complete Financial History (Backend)

When a user navigates to the page, the frontend makes a request to the API endpoint: `GET /api/mikrotik/users/:id/payment-stats`.

The backend `getUserPaymentStats` function then performs its first and most crucial task: it gathers all the raw financial data for that specific user.

1.  It queries the `WalletTransaction` collection in the database.
2.  It fetches **every single transaction** linked to that user's ID.
3.  It sorts these transactions chronologically, from oldest to newest. This is essential for the next step.

At this point, the backend has a complete, ordered history of every time the user was billed and every time they paid.

### Step 2: The Core Logic - Matching Bills to Payments (Backend)

This is where the "intelligence" of the feature lies. The backend code now processes the transaction history to understand the user's behavior.

1.  **Separating Bills from Payments:** The code splits the transactions into two lists:
    -   **`debitTransactions`**: These are the bills. Each `Debit` represents a monthly charge. The date of the debit is considered the **"Due Date"**.
    -   **`creditTransactions`**: These are the payments made by the customer.

2.  **The Matching Loop:** The code then iterates through every single **bill (`Debit`)** one by one. For each bill, it asks: "Was this bill paid, and if so, when?"
    -   It searches the `creditTransactions` list to find the **first payment** that occurred **on or after** the bill's due date and was **large enough** to cover the bill amount.

3.  **Applying the Business Rule (The Grace Period):** The code defines a configurable "grace period". This value is stored in the `ApplicationSettings` model (as `paymentGracePeriodDays`) and defaults to 3 days. A payment is still considered "On-Time" if it's made within this grace period after the bill's due date.

### Step 3: Calculating the Key Metrics (Backend)

As the code loops through each bill and its corresponding payment, it calculates the statistics that are displayed in the cards at the top of the page.

-   **On-Time vs. Late Payments:**
    -   If a payment is found and its date is within the 3-day grace period, it increments the `onTimePayments` counter.
    -   If the payment date is *after* the grace period, it increments the `latePayments` counter.

-   **Average Payment Delay:**
    -   For every late payment, it calculates the number of days between the due date and the payment date.
    -   It adds this number to a running total, `totalDelayDays`.
    -   After the loop, it calculates the average by dividing `totalDelayDays` by the number of `latePayments`.

-   **On-Time Rate:** A simple percentage calculated after the loop: `(On-Time Payments / Total Payments) * 100`.

-   **Lifetime Value:** The sum of the `amount` of all `creditTransactions` (i.e., the total amount of money the customer has ever paid).

### Step 5: Displaying the Results (Frontend)

Finally, the backend bundles all of this calculated data into a single JSON object and sends it to the frontend.

The frontend page receives this object and:
1.  Renders the `StatCard` components using the calculated metrics (e.g., `onTimePayments`, `averagePaymentDelay`).
2.  Passes the `paymentHistory` array to the `DataTable` component.
3.  The table then displays each entry, using different colored badges for the status ("On-Time", "Late", "Pending") and showing "N/A" for the paid date if the bill is still pending.
