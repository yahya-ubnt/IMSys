# SMS Module Specification

This document outlines the functionality of the SMS module, which is designed for communication with clients and users.

## 1. Main Navigation

The SMS module will be accessible through a main navigation item with the following dropdown menu:

- **Compose New Message**: Opens a page to create and send a new SMS.
- **Sent SMS**: Opens a page to view the history and status of all dispatched SMS messages.
- **Expire SMS**: Manages automated SMS notifications for expiring services.
- **Acknowledgement SMS**: Manages automated SMS replies for specific user actions.
- **SMS Templates**: A section to create, edit, and delete pre-defined SMS templates.

---

## 2. Sent SMS

This page displays a comprehensive log of all SMS messages that have been sent through the system. It includes advanced features for searching, pagination, and exporting data.

-   **Components**:
    -   **Filtering and Searching**:
        -   A search bar for free-text search within the `Message` content.
        -   A dedicated filter for `Mobile Number`.
        -   A date range picker to filter by `Date & Time`.
        -   A dropdown to filter by `Message Type`.
        -   A dropdown to filter by `SMS Status`.
    -   **Data Export**: Buttons to export the currently filtered data into various formats:
        -   `Export to CSV`
        -   `Export to Excel`
        -   `Export to PDF`
    -   **Table Actions**:
        -   `Print`: An option to print the current view of the table.
        -   `Copy`: An option to copy the table data to the clipboard.
    -   **SMS Log Table**: A table with the following columns:
        -   **ID**: A unique sequential identifier for each entry.
        -   **SMS Status**: The delivery status of the message (e.g., `Success`, `Failed`, `Pending`).
        -   **Mobile Number**: The recipient's phone number.
        -   **Message**: The full text of the SMS message that was sent.
        -   **Message Type**: The category of the message (e.g., `Acknowledgement`, `Expiry Alert`, `Compose New Message`).
        -   **Date & Time**: The exact date and time the message was sent.
    -   **Pagination**:
        -   Controls at the bottom of the table to navigate through pages of results (e.g., "Previous", "Next", page numbers).
        -   A dropdown to select the number of rows to display per page (e.g., 10, 25, 50, 100).

---

## 3. Compose New Message

This page allows users to send SMS messages to various recipients. The page will have a primary selection to determine the recipient group.

### 2.1. Send to Users

-   **UI Element**: A tab or radio button labeled "Users".
-   **Functionality**: Sends an SMS to one or more specific, registered users.
-   **Components**:
    -   **Select User(s)**: A multi-select dropdown menu containing a list of all registered users in the system.
    -   **Message Body**: A textarea for composing the SMS message.
    -   **Send SMS Button**: A button to dispatch the message to the selected user(s).

### 2.2. Send to Mikrotik Group

-   **UI Element**: A tab or radio button labeled "Mikrotik Group".
-   **Functionality**: Sends an SMS to all users associated with a specific Mikrotik router.
-   **Components**:
    -   **Select Mikrotik Router**: A dropdown menu to select a specific Mikrotik router from the list of registered routers.
    -   **Message Body**: A textarea for composing the SMS message.
    -   **Send SMS Button**: A button to dispatch the message to all users managed by the selected router.

### 2.3. Send to Apartment/House Number

-   **UI Element**: A tab or radio button labeled "Location".
-   **Functionality**: Sends an SMS to all users within a specific apartment or house number.
-   **Components**:
    -   **Select Apartment/House Number**: A dropdown menu to select a specific apartment or house number.
    -   **Message Body**: A textarea for composing the SMS message.
    -   **Send SMS Button**: A button to dispatch the message to all users registered in that location.

### 2.4. Send to Unregistered Users

-   **UI Element**: A tab or radio button labeled "Unregistered Users".
-   **Functionality**: Sends a one-off SMS to a phone number that is not registered in the system.
-   **Components**:
    -   **Recipient Phone Number**: A text input field for entering the recipient's phone number.
    -   **Message Body**: A textarea for composing the SMS message.
    -   **Send SMS Button**: A button to dispatch the message.

---

## 4. Expire SMS

This section is for creating and managing automated SMS notifications to be sent to users relative to their service expiration date.

### 4.1. Main View

The main view for Expire SMS initially displays a table that may be empty.

-   **Components**:
    -   **Schedule SMS Expiry Button**: Located at the top-right of the page. Clicking this opens a pop-up modal to create a new expiry notification schedule.
    -   **Schedules Table**: A table that lists all created expiry schedules. When a new schedule is created, it appears here. The columns will include:
        -   **ID**: A unique identifier for the schedule.
        -   **Send Rule**: The timing rule for sending the SMS (e.g., "3 Days Before Expiry").
        -   **Message**: A preview of the message template.
        -   **Status**: Whether the schedule is `Active` or `Inactive`.
        -   **Actions**: Buttons to `Edit` or `Delete` the schedule.

### 4.2. "Schedule SMS Expiry" Pop-up

This pop-up form allows for the creation of a new scheduled message.

-   **Fields**:
    -   **Select day to send SMS**: A dropdown menu with options from "1 Day" to "10 Days".
    -   **Timing**: A dropdown with the options:
        -   `Before`: Sends the SMS before the expiration date.
        -   `After`: Sends the SMS after the expiration date.
        -   `Not Applicable`: For messages not tied to the expiry date itself.
    -   **Message Body**: A textarea for composing the SMS.
-   **Template Variables**: A set of buttons that insert dynamic placeholders into the message body:
    -   `Add Name`: Inserts `{{customer_name}}`
    -   `Add Reference Number`: Inserts `{{reference_number}}`
    -   `Add Phone`: Inserts `{{customer_phone}}`
    -   `Add Amount`: Inserts `{{transaction_amount}}`
    -   `Add Expiry Date`: Inserts `{{expiry_date}}`
-   **Actions**:
    -   **Add Message Button**: Saves the new schedule, adds it to the table on the main view, and closes the pop-up.
    -   **Close Button**: Closes the pop-up without saving.

### 4.3. Backend Logic

-   A scheduled task (e.g., a daily cron job) must run on the server.
-   This task will query all `Active` expiry schedules.
-   For each active schedule, it will find all users whose expiration date matches the rule (e.g., is 3 days from now).
-   It will then generate the personalized message using the template and send the SMS to each of those users.
-   A log of each sent message should be created in the "Sent SMS" log.

---

## 5. Acknowledgement SMS

This section is for mapping specific system events (triggers) to an SMS template from the "SMS Templates" module. This creates a fully automated SMS response system.

### 5.1. Main View

The main view displays a table of all configured trigger-to-template mappings.

-   **Components**:
    -   **+ New Acknowledgement Button**: Located at the top-right. Opens a pop-up to create a new mapping.
    -   **Acknowledgements Table**: A table listing all created mappings.
        -   **Number**: A sequential identifier (1, 2, 3...).
        -   **Trigger Type**: The system event that triggers the SMS (e.g., `Payment Received`).
        -   **Linked Template**: The name of the SMS template that will be sent.
        -   **Action**: Buttons to `Update` or `Delete` the mapping.

### 5.2. "+ New Acknowledgement" Pop-up

This pop-up form allows for the mapping of a trigger to a template.

-   **Fields**:
    -   **Trigger Type**: A dropdown menu of available system events, including:
        -   `New User Registration` (for welcome messages)
        -   `Payment Received` (e.g., for M-PESA confirmation)
        -   `Renewal Confirmation`
        -   `Installation Scheduled`
        -   `Installation Completed`
        -   (and other relevant system events)
    -   **Select SMS Template**: A dropdown menu populated with all available templates from the "SMS Templates" module.
-   **Actions**:
    -   **Save Mapping Button**: Saves the new trigger-to-template link, adds it to the table, and closes the pop-up.
    -   **Close Button**: Closes the pop-up without saving.

### 5.3. Backend Logic

-   The system must be designed to emit events when certain actions occur (e.g., `payment_received`, `new_user_created`).
-   An event listener will catch these events.
-   When an event is detected, the system will look up if a mapping exists for that `Trigger Type` in the Acknowledgements table.
-   If a mapping exists, it will retrieve the content of the `Linked Template`.
-   It will then generate the personalized message using the template variables and send the SMS to the relevant user.
-   A log of the sent message will be created in the "Sent SMS" log.

---

## 6. SMS Templates

This section is for creating and managing general-purpose, reusable SMS templates. These templates can be selected when using "Compose New Message" or linked to an automated trigger in the "Acknowledgement SMS" module.

### 6.1. Main View

The main view displays a table of all saved general-purpose templates.

-   **Components**:
    -   **+ New SMS Template Button**: Located at the top-right. Opens a pop-up to create a new template.
    -   **Templates Table**: A table listing all created templates.
        -   **Number**: A sequential identifier (1, 2, 3...).
        -   **Template Name**: A unique, descriptive name for the template (e.g., "Network Maintenance Alert").
        -   **Message Body**: A preview of the SMS message template.
        -   **Action**: Buttons to `Update` or `Delete` the template.

### 6.2. "+ New SMS Template" Pop-up

This pop-up form allows for the creation of a new general-purpose template.

-   **Fields**:
    -   **Template Name**: A text input field for the name of the template.
    -   **Message Body**: A textarea for composing the SMS.
-   **Template Variables**: Buttons that insert common dynamic placeholders into the message:
    -   `Add Name`: Inserts `{{customer_name}}`
    -   `Add Reference Number`: Inserts `{{reference_number}}`
    -   `Add Phone`: Inserts `{{customer_phone}}`
    -   `Add Company Name`: Inserts `{{company_name}}`
    -   `Add User Portal`: Inserts `{{user_portal_url}}`
-   **Actions**:
    -   **Save Template Button**: Saves the new template, adds it to the table, and closes the pop-up.
    -   **Close Button**: Closes the pop-up without saving.

## 7. SMS Gateway Integration

This section defines how the system integrates with external SMS gateway providers to send messages.

### 7.1. Overview

All SMS sending functionality within the application will utilize a configured SMS gateway. The system will support configurable providers, allowing for flexibility and scalability.

### 7.2. Configuration Parameters

These parameters will be managed via environment variables and loaded into the backend configuration.

-   **`SMS_PROVIDER`**: (String) Specifies the SMS gateway provider to use (e.g., `GENERIC_HTTP`, `TWILIO`, `CELCOM`).
-   **`SMS_API_KEY`**: (String) The primary API key or username for authentication with the SMS provider.
-   **`SMS_API_SECRET`**: (String, Optional) The API secret or password for authentication.
-   **`SMS_SENDER_ID`**: (String) The alphanumeric sender ID or short code that will appear as the sender of the SMS message.
-   **`SMS_ENDPOINT_URL`**: (String) The base URL for the SMS provider's API endpoint.
-   **`SMS_ACCOUNT_SID`**: (String, Optional) Specific to providers like Twilio (Account SID).
-   **`SMS_AUTH_TOKEN`**: (String, Optional) Specific to providers like Twilio (Auth Token).

### 7.3. SMS Sending Logic

#### 7.3.1. Abstraction Layer (`smsService.js`)

-   All SMS sending requests from various parts of the application (e.g., Compose, Expire, Acknowledgement) will go through a centralized `smsService.js`.
-   This service will act as an abstraction layer, handling provider-specific API calls, authentication, and request formatting.
-   It will dynamically select the appropriate sending mechanism based on the `SMS_PROVIDER` configuration.

#### 7.3.2. Generic HTTP Provider (Example)

If `SMS_PROVIDER` is `GENERIC_HTTP`, the `smsService.js` will construct an HTTP POST request to the `SMS_ENDPOINT_URL` with parameters like `to`, `from` (Sender ID), and `message`.

#### 7.3.3. Error Handling and Logging

-   The `smsService.js` will capture responses from the SMS gateway.
-   Successful sends will update the `SMS Status` in the "Sent SMS" log to `Success`.
-   Failed sends will update the `SMS Status` to `Failed` and log the error message from the provider.
-   Retries for transient errors should be considered (e.g., network issues).

#### 7.3.4. Delivery Reports (Optional)

-   If the SMS provider supports delivery reports (DLRs) via webhooks, the system can expose a callback URL to receive these reports.
-   This would allow for real-time updates of SMS delivery status (e.g., `Delivered`, `Read`).

### 7.4. Environment Handling

-   Different `SMS_PROVIDER` and related credentials can be configured for `development`, `staging`, and `production` environments using `.env` files.
-   This ensures that test messages are sent via a sandbox or test account, and live messages via the production gateway.