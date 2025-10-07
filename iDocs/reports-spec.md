# Reports Module Specification

This document outlines the specifications for the Reports module in the ISP Management System.

## 1. Main Navigation

A new top-level menu item labeled "Reports" will be added to the main navigation sidebar. When clicked, it will reveal the following sub-menu items:

-   M-Pesa Alert
-   M-Pesa Report
-   Location Report

---

## 2. Location Report

The Location Report provides a way to view revenue generated from specific apartment/house numbers over a defined period.

### 2.1. User Interface

The UI will consist of the following components:

-   **Select Starting Date:** A date picker that allows the user to select the start date for the report. The picker should allow selecting the year and month.
-   **Select Ending Date:** A date picker that allows the user to select the end date for the report. The picker should also allow selecting the year and month.
-   **Select Location:** A dropdown menu populated with the list of all unique apartment/house numbers registered in the system.
-   **Generate Report Button:** A button that, when clicked, generates and displays the report based on the selected criteria.

### 2.2. Report Generation

When the "Generate Report" button is clicked, the system will fetch and display the data in a table format.

-   Above the table, a summary will show the **Total Revenue** for the selected location and period. The text will read: "Total revenue from [Apartment/House Number] between [Start Date] and [End Date] is [Total Amount]."

### 2.3. Report Table

The generated report will be displayed in a table with the following columns:

| SN  | Official Name | Total Amount | Type   | Reference Number |
| --- | ------------- | ------------ | ------ | ---------------- |
| 1   | John Doe      | 5000         | PPP    | MPESA-REF-123    |
| 2   | Jane Smith    | 2500         | Static | MPESA-REF-456    |
| ... | ...           | ...          | ...    | ...              |

-   **SN:** Serial Number for the entries in the report.
-   **Official Name:** The full name of the client.
-   **Total Amount:** The total amount of money paid by the client within the selected period.
-   **Type:** The client's connection type (e.g., PPP or Static).
-   **Reference Number:** The transaction reference number for the payment.

---

## 3. M-Pesa Alert

This section provides alerts for instances where a customer has made a payment via M-Pesa, but their service was not automatically reconnected. This helps identify and resolve issues where the reconnection process failed due to system downtime, network errors, or other problems.

### 3.1. User Interface

The UI will primarily consist of a table that displays the alerts.

### 3.2. Alert Table

The alerts will be displayed in a table with the following columns:

| Number | Message                                                                                                                            | Date & Time         | Action |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| 1      | Customer [M-Pesa Reference] paid KES 2000 (Transaction ID: [M-Pesa Transaction ID]) on 2025-08-14 at 05:38:28 but was not reconnected. | 2025-08-14 05:38:28 | Delete |
| 2      | ...                                                                                                                                | ...                 | ...    |

-   **Number:** A serial number for the alert entries.
-   **Message:** A detailed message that includes:
    -   The customer's M-Pesa reference number.
    -   The amount paid.
    -   The M-Pesa transaction ID.
    -   The date and time of the payment.
    -   A clear statement that the customer was not reconnected.
-   **Date & Time:** The specific date and time when the transaction occurred.
-   **Action:** A "Delete" button that allows the user to remove the alert from the list once it has been addressed.

---

## 4. M-Pesa Report

The M-Pesa Report provides a detailed list of all successful M-Pesa transactions within a specified date range.

### 4.1. User Interface

The UI will consist of the following components:

-   **Select Starting Date:** A date picker to set the beginning of the reporting period.
-   **Select Ending Date:** A date picker to set the end of the reporting period.
-   **Generate Report Button:** A button to generate and display the report based on the selected dates.

### 4.2. Report Generation

Upon clicking the "Generate Report" button, the system will fetch and display the transaction data.

-   A summary above the table will show the **Total Amount** from all transactions in the selected period.

### 4.3. Report Table

The generated report will be displayed in a table with the following columns:

| Number | Transaction ID      | Official Name | Amount | Date & Time         |
| ------ | ------------------- | ------------- | ------ | ------------------- |
| 1      | RKTQ48I2G6          | John Doe      | 2000   | 2025-08-14 05:38:28 |
| 2      | ...                 | ...           | ...    | ...                 |

-   **Number:** Serial number for the transaction entries.
-   **Transaction ID:** The unique M-Pesa transaction ID.
-   **Official Name:** The name of the client who made the payment.
-   **Amount:** The transaction amount.
-   **Date & Time:** The date and time of the transaction.
