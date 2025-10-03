# General Settings - Specification

This document outlines the specifications for the "General Settings" feature of the application.

## 1. Overview

The General Settings page will provide administrators with a centralized location to manage core application settings related to branding, company information, and billing/automation logic. This feature will replace the current placeholder content in the "General" tab on the main settings page.

## 2. Backend Implementation

### 2.1. `ApplicationSettings` Model Expansion

The existing `ApplicationSettings` model (`/backend/models/ApplicationSettings.js`) will be expanded to include the following fields:

```javascript
const ApplicationSettingsSchema = mongoose.Schema(
  {
    // --- Existing Fields ---
    appName: { type: String, required: true, default: "MEDIATEK MANAGEMENT SYSTEM" },
    logoIcon: { type: String, required: true, default: "Wifi" }, // Will store path to uploaded logo
    paymentGracePeriodDays: { type: Number, required: true, default: 3 },

    // --- New Fields ---
    favicon: { type: String, default: "/favicon.ico" }, // Stores path to uploaded favicon
    currencySymbol: { type: String, required: true, default: "KES" },
    taxRate: { type: Number, required: true, default: 0 }, // Percentage
    autoDisconnectUsers: { type: Boolean, required: true, default: true }, // Master toggle
    sendPaymentReminders: { type: Boolean, required: true, default: true }, // Master toggle
    disconnectTime: { 
        type: String, 
        enum: ['expiry_time', 'end_of_day'], 
        default: 'end_of_day' 
    },
    companyInfo: {
      name: { type: String, default: "" },
      country: { type: String, default: "Kenya" },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    portalUrls: {
        admin: { type: String, default: "" },
        client: { type: String, default: "" },
    },

    // --- Existing M-Pesa Fields ---
    mpesaPaybill: { ... },
    mpesaTill: { ... }
  },
  { timestamps: true }
);
```

### 2.2. API Endpoint

A new set of API endpoints will be created to handle the general settings. The existing `/api/settings/branding` route will be repurposed and renamed.

-   **Route:** `/api/settings/general`
-   **Controller:** `/backend/controllers/settingsController.js`

#### **GET `/api/settings/general`**

-   **Description:** Fetches all general application settings.
-   **Controller Function:** `getGeneralSettings` (rename of `getBrandingSettings`).
-   **Logic:**
    -   Find the `ApplicationSettings` document.
    -   If it doesn't exist, create one with the default values defined in the model.
    -   Return the full settings object.

#### **PUT `/api/settings/general`**

-   **Description:** Updates the general application settings.
-   **Controller Function:** `updateGeneralSettings` (rename of `updateBrandingSettings`).
-   **Logic:
    -   Find the `ApplicationSettings` document. If it doesn't exist, create it.
    -   Update the document with the data from the request body (`req.body`).
    -   Handle file uploads for `logoIcon` and `favicon` separately, saving their paths to the model.
    -   Save the updated document and return it.

## 3. Frontend Implementation

### 3.1. New Component: `GeneralSettingsForm.tsx`

A new component will be created at `/frontend/src/app/settings/general/page.tsx` to encapsulate the form logic and UI.

### 3.2. UI Layout and Sections

The form will be organized into three distinct `Card` sections for clarity:

**Section 1: Branding**
-   **Company Logo:**
    -   UI: File input with a preview of the current logo.
    -   Constraints: `JPEG`, `PNG`. Max size: `2MB`.
    -   Action: "Change Logo" button.
-   **Favicon:**
    -   UI: File input with a preview of the current favicon.
    -   Constraints: `JPEG`, `PNG`, `GIF`. Max size: `1MB`.
    -   Action: "Update Favicon" button.

**Section 2: Company Information**
-   **Company Name:** (Text Input)
-   **Country:** (Dropdown of African countries, defaulting to Kenya)
-   **Company Email:** (Email Input)
-   **Company Phone:** (Phone Input, defaulting to `+254`)
-   **Admin Portal URL:** (URL Input)
-   **Client Portal URL:** (URL Input)

**Section 3: Billing & Automation**
-   **Currency Symbol:** (Text Input, e.g., "KES")
-   **Payment Grace Period:** (Number Input, labeled "in days")
-   **Disconnect Time on Expiry Day:** (Dropdown with options: "At the exact time of expiry", "At the end of the day")
-   **Auto-Disconnect Expired Users:** (Toggle Switch)
-   **Send Payment Reminders:** (Toggle Switch)

### 3.3. Form Logic

-   The component will use `react-hook-form` with `zod` for validation.
-   On mount, it will call the `GET /api/settings/general` endpoint to fetch and populate the form with existing data.
-   A "Save Changes" button will submit the form, sending a `PUT` request to `/api/settings/general` with the updated data.
-   Loading and error states will be handled appropriately, with toasts for user feedback.

### 3.4. Integration

The `GeneralSettingsForm` component will be imported into the main settings page (`/frontend/src/app/settings/page.tsx`) and will replace the placeholder content within the "General" `StyledTabsContent` tab.

### 3.5. UI Layout and Consistency

To maintain a consistent look and feel with other forms in the application (e.g., "Add New Mikrotik User"), the `GeneralSettingsForm` component must be rendered within a container that centers it, constrains its width, and applies the standard "glassmorphism" aesthetic.

-   The component will be wrapped in a `motion.div` with the following classes: `bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl overflow-hidden`.
-   The `Card` component inside will have the classes `bg-transparent border-none` to blend with the glassmorphism container.
-   This ensures the form is compact, centered, and visually aligned with the application's modern and professional design.
