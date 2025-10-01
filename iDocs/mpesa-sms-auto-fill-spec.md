## Feature Specification: M-Pesa SMS Auto-fill for Daily Transactions

**Goal:** To streamline the manual entry of M-Pesa transactions by allowing users to paste M-Pesa SMS confirmation messages, from which relevant transaction details will be automatically extracted and used to pre-fill the transaction form.

**Scope:** This feature will be integrated into the "Add New Transaction" page, providing a dedicated input area for M-Pesa SMS messages and a mechanism to parse and apply the extracted data to the form fields.

### Key Components:

1.  **Frontend UI Integration (on "Add New Transaction" page - `frontend/src/app/daily-transactions/new/page.tsx`):**
    *   **Dedicated Input Area:** A `Textarea` or `Input` field specifically for pasting M-Pesa SMS messages. This could be a collapsible section or a separate modal.
    *   **"Parse & Apply" Button:** A button next to the input area that, when clicked, triggers the parsing logic.
    *   **Visual Feedback:** Provide feedback to the user (e.g., "Parsing...", "Parsed successfully!", "Error parsing message: [reason]").

2.  **Client-Side SMS Parsing Logic:**
    *   **Location:** A new utility function or service in the frontend (e.g., `frontend/src/lib/mpesaSmsParser.ts`).
    *   **Mechanism:** This function will contain regular expressions and string manipulation logic to extract key information from common M-Pesa SMS formats.
        *   **Information to Extract:**
            *   Transaction ID (e.g., `[A-Z0-9]{10}`)
            *   Amount (e.g., `Ksh(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)`)
            *   Date and Time (e.g., `(\d{1,2}/\d{1,2}/\d{2}) at (\d{1,2}:\d{2} [AP]M)`)
            *   Recipient/Sender Name (e.g., `from (.+) on`) or `to (.+) for`
            *   Recipient/Sender Phone Number (e.g., `Phone: (\d+)`)
            *   Transaction Type (e.g., "sent to", "paid to", "received from")
            *   New M-Pesa Balance (optional, for display only, not for saving as a transaction detail)
    *   **Robustness:** The parser should be designed to handle variations in SMS formats as much as possible, but acknowledge that it might not be foolproof for all messages.

3.  **Form Auto-filling:**
    *   Upon successful parsing, the extracted data will be used to update the `formData` state of the "Add New Transaction" form.
    *   **Mapping to `DailyTransaction` fields:**
        *   `date`: From parsed date/time.
        *   `amount`: From parsed amount.
        *   `method`: Automatically set to "M-Pesa".
        *   `transactionMessage`: The full pasted SMS content.
        *   `description`: Derived from the transaction type and recipient/sender.
        *   `label`: Can be a default (e.g., "M-Pesa Payment") or left for user to select.
        *   `transactingPartyName`: From parsed recipient/sender name.
        *   `contactInfo`: From parsed recipient/sender phone number.

### User Experience (UX) Flow:

1.  User navigates to "Add New Transaction" page.
2.  User sees a section (e.g., "Auto-fill from M-Pesa SMS") with a `Textarea` and a "Parse & Apply" button.
3.  User pastes an M-Pesa SMS message into the `Textarea`.
4.  User clicks "Parse & Apply".
5.  The system parses the message.
    *   If successful, the form fields (`date`, `amount`, `method`, `transactionMessage`, `description`, `transactingPartyName`, `contactInfo`) are pre-filled.
    *   If unsuccessful, an error message is displayed.
6.  User reviews the pre-filled form, makes any necessary adjustments, and then submits the transaction.

### Technical Considerations:

*   **Regex Complexity:** M-Pesa SMS formats can vary. The regexes need to be robust but might require maintenance if formats change significantly.
*   **Error Handling:** Graceful handling of unparseable messages.
*   **Security:** Since parsing is client-side, sensitive data is not sent to the backend for parsing, which is a security advantage over server-side SMS parsing.
*   **User Education:** Clear instructions on how to use the feature and what to expect.

### Advantages of this approach:

*   **User Control:** User explicitly initiates the parsing and can review/edit.
*   **No SMS Access:** Avoids the need for direct SMS access on the user's phone or server-side SMS processing.
*   **Improved Accuracy:** Reduces manual typing errors.
*   **Faster Entry:** Speeds up the transaction recording process.
*   **Security:** Client-side parsing keeps sensitive SMS data on the user's device.
