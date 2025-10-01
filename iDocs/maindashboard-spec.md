## Dashboard Specification: Collections Overview

### 1. Overview

This specification outlines the requirements for the main dashboard, accessible from the sidebar, which will provide key collection statistics and trends. The dashboard will feature four prominent stat cards displaying total collections for "Today," "Weekly," "Monthly," and "Yearly" periods, along with an interactive area chart visualizing monthly collection trends over a selected year.

### 2. Components

#### 2.1. Stat Cards (Collections Summary)

There will be four distinct stat cards, each displaying a total collection amount for a specific period.

*   **Data Source:** All collection amounts will be derived from successful user payments. This includes payments made via M-Pesa pay bill (identified by account number) and cash payments recorded through the system's cash purchase model. The amount considered for collection is the user's subscription/monthly fee.
*   **Calculation:** The total amount for each card will be the sum of all relevant subscription/monthly fees paid within the specified time frame.
*   **Currency:** All amounts will be displayed in the local currency (e.g., KES).

    *   **2.1.1. Today's Collection**
        *   **Title:** Today's Collection
        *   **Metric:** Total amount collected from the beginning of the current calendar day (00:00:00) up to the current time.

    *   **2.1.2. Weekly Collection**
        *   **Title:** Weekly Collection
        *   **Metric:** Total amount collected from the beginning of the current calendar week (e.g., Monday 00:00:00) up to the current time. (Assumption: Week starts on Monday. This can be configured if needed).

    *   **2.1.3. Monthly Collection**
        *   **Title:** Monthly Collection
        *   **Metric:** Total amount collected from the beginning of the current calendar month (1st day 00:00:00) up to the current time.

    *   **2.1.4. Yearly Collection**
        *   **Title:** Yearly Collection
        *   **Metric:** Total amount collected from the beginning of the current calendar year (January 1st 00:00:00) up to the current time.

    *   **2.1.5. Monthly Expense**
        *   **Title:** Monthly Expense (Current Month)
        *   **Metric:** Total amount of expenses recorded for the current calendar month (e.g., September 1st 00:00:00 up to current time).
        *   **Data Source:** Derived from the system's expense module.

#### 2.2. Monthly Collections Area Chart

An interactive area chart will visualize the total monthly collections and expenses over a selected year.

*   **Chart Type:** Area Chart.
*   **X-axis:** Months of the year (January to December).
*   **Y-axis:** Total collection/expense amount for each respective month.
*   **Data Points:** Each point on the chart will represent the aggregated total collection or expense for that specific month.
*   **Data Series:**
    *   **Collections:** Displayed with a primary color (e.g., blue).
    *   **Expenses:** Displayed with a distinct secondary color (e.g., red or orange) to differentiate from collections.
*   **Interactivity:**
    *   Hovering over a month should display a tooltip with the exact total collection and expense amounts for that month.
    *   The chart should be responsive and adapt to different screen sizes.

#### 2.3. Year Filter

A filter mechanism will be provided to allow users to select the year for which the monthly collections area chart data is displayed.

*   **Type:** Dropdown or similar selection component.
*   **Options:** Should list available years for which collection data exists, typically including the current year and previous years.
*   **Functionality:** Selecting a year will dynamically update the Monthly Collections Area Chart to display data for the chosen year.

### 3. Data Requirements (Backend)

New API endpoints will be required to fetch the necessary data for the dashboard.

*   **Endpoint 1: `/api/dashboard/collections/summary`**
    *   **Method:** GET
    *   **Response:** JSON object containing the total collections for today, weekly, monthly, and yearly periods.
    *   **Example Response:**
        ```json
        {
            "today": 15000.00,
            "weekly": 75000.00,
            "monthly": 300000.00,
            "yearly": 3500000.00
        }
        ```

*   **Endpoint 2: `/api/dashboard/collections-and-expenses/monthly?year=<YYYY>`**
    *   **Method:** GET
    *   **Parameters:** `year` (integer, required) - The year for which to retrieve monthly collection and expense data.
    *   **Response:** JSON array of objects, each representing a month's collections and expenses.
    *   **Example Response:**
        ```json
        [
            {"month": "January", "collections": 250000.00, "expenses": 50000.00},
            {"month": "February", "collections": 280000.00, "expenses": 45000.00},
            // ... up to December
            {"month": "December", "collections": 320000.00, "expenses": 60000.00}
        ]
        ```
    *   **Data Aggregation Logic:** The backend will need to query the `Payment` or `Bill` models for collections and the `Expense` model for expenses, filter by date, and aggregate the `amount` field for each month within the specified year.

*   **Endpoint 3: `/api/dashboard/expenses/monthly-summary`**
    *   **Method:** GET
    *   **Response:** JSON object containing the total expenses for the current month.
    *   **Example Response:**
        ```json
        {
            "monthlyExpense": 15000.00
        }
        ```
    *   **Data Aggregation Logic:** The backend will need to query the `Expense` model, filter by the current month, and sum the `amount` field.

### 4. UI/UX Considerations

*   **Layout:** The stat cards should be prominently displayed at the top of the dashboard, followed by the area chart. The year filter should be easily accessible, ideally above the chart.
*   **Responsiveness:** The dashboard layout and components should be fully responsive and adapt well to various screen sizes (desktop, tablet, mobile).
*   **Loading States:** Appropriate loading indicators should be displayed while data is being fetched from the backend.
*   **Error Handling:** Clear messages should be displayed if data cannot be loaded or if there are API errors.

### 5. Technical Considerations

*   **Frontend Framework:** (Assuming Next.js based on `frontend` directory structure) React components for the dashboard, stat cards, chart, and filter.
*   **Charting Library:** A suitable charting library (e.g., Chart.js, Recharts, Nivo) will be integrated for the area chart visualization.
*   **Backend Technology:** (Assuming Node.js/Express based on `backend` directory structure) New routes and controller logic will be implemented to serve the dashboard data.
*   **Database Queries:** Efficient database queries will be crucial for aggregating collection data, especially for weekly, monthly, and yearly totals, and for the chart. Indexing on payment dates will be important.
