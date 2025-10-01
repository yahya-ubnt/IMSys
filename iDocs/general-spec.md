# General Settings Page Specification

This document outlines the structure and functionality of the General Settings page.

## 1. General Settings Section

This section contains the core configuration for the company.

-   **Company Name:**
    -   **Type:** Text Input
    -   **Description:** The legal name of the company.
-   **Country:**
    -   **Type:** Dropdown Select
    -   **Description:** A list of all African countries.
-   **Company Email:**
    -   **Type:** Email Input
    -   **Description:** The official email address for the company.
-   **Company Phone:**
    -   **Type:** Phone Number Input
    -   **Description:** A valid Kenyan phone number.
    -   **Default:** The input field should be pre-filled with `254`.
-   **Company URL:**
    -   **Type:** URL Input
    -   **Description:** The main URL for the company's website.
-   **User Portal URL:**
    -   **Type:** URL Input
    -   **Description:** The URL for the MikroTik users' portal.
-   **Default Customer Expiry:**
    -   **Type:** Two Dropdown Selects
    -   **Description:** Configures when customer accounts expire and are disconnected.
    -   **Dropdown 1 (Expiry Condition):**
        -   Options: `End of Day`, `After a Month`
    -   **Dropdown 2 (Disconnect Time):**
        -   Options: `End of Day`, `Time of Expiry`
-   **Update Button:**
    -   **Action:** Saves all the changes made in the General Settings section.

## 2. Favicon Settings Section

This section allows for updating the favicon of the application, which is primarily used for the login page.

-   **Image Preview:** Displays the current favicon.
-   **File Input:**
    -   **Label:** "Update Favicon"
    -   **Supported Formats:** JPEG, PNG, GIF
    -   **Size Limit:** 1MB
    -   **Dimensions:** 200x200 pixels
-   **Update Button:**
    -   **Action:** Uploads and saves the new favicon.

## 3. Logo Settings Section

This section allows for updating the main company logo, which is displayed on the application's sidebar.

-   **Image Preview:** Displays the current logo.
-   **File Input:**
    -   **Label:** "Update Logo"
    -   **Supported Formats:** JPEG, PNG, GIF
    -   **Size Limit:** 1MB
-   **Update Button:**
    -   **Action:** Uploads and saves the new logo.
