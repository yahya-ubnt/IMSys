# M-Pesa Configuration and Activation Specification

## 1. Objective

To create a secure and user-friendly interface within the admin dashboard that allows administrators to configure, update, and activate M-Pesa payment gateway settings for both Pay Bill and Till numbers. This will replace the current static, environment-variable-based configuration, enabling dynamic updates without server restarts.

## 2. Backend Implementation

### 2.1. Database Schema (`ApplicationSettings` Model)

The `ApplicationSettings` model in `backend/models/ApplicationSettings.js` will be extended to include dedicated fields for M-Pesa credentials.

```javascript
const ApplicationSettingsSchema = mongoose.Schema(
  {
    // Existing fields
    appName: { ... },
    logoIcon: { ... },

    // New M-Pesa Fields
    mpesaPaybill: {
      paybillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false }
    },
    mpesaTill: {
      tillStoreNumber: { type: String, trim: true },
      tillNumber: { type: String, trim: true },
      consumerKey: { type: String, trim: true },
      consumerSecret: { type: String, trim: true },
      passkey: { type: String, trim: true },
      activated: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true,
  }
);
```

### 2.2. API Endpoints

New endpoints will be created in `backend/routes/settingsRoutes.js`.

- **`GET /api/settings/mpesa`**:
  - **Description**: Retrieves the current M-Pesa configuration.
  - **Controller**: `settingsController.getMpesaSettings`
  - **Response**: An object containing `mpesaPaybill` and `mpesaTill` details.

- **`PUT /api/settings/mpesa`**:
  - **Description**: Updates the M-Pesa configuration (Pay Bill or Till).
  - **Controller**: `settingsController.updateMpesaSettings`
  - **Request Body**: `{ "type": "paybill" | "till", "data": { ... } }`
  - **Response**: The updated settings object.

- **`POST /api/settings/mpesa/activate`**:
  - **Description**: Registers the callback URLs with the Safaricom Daraja API for a specified configuration.
  - **Controller**: `settingsController.activateMpesa`
  - **Request Body**: `{ "type": "paybill" | "till" }`
  - **Response**: Success message or a detailed error from the Daraja API.

### 2.3. Service Layer (`mpesaService.js`)

- The service will be refactored to fetch M-Pesa credentials from the database (`ApplicationSettings`) instead of `process.env`.
- A new function, `registerCallbackURL(config)`, will be created. This function will:
  1. Obtain a Daraja API token using the provided credentials.
  2. Make a request to the Daraja `C2B URL Registration API`.
  3. Handle the response and update the `activated` flag in the database.

## 3. Frontend Implementation

### 3.1. UI Components

A new settings page will be created in the frontend application (`src/app/admin/settings/mpesa`).

- **Main Component**: `MpesaSettings.js`
  - **Tabs**: Two tabs: "M-Pesa Pay Bill" and "M-Pesa Till".
  - **State**: Will manage the form data and API loading/error states.

- **M-Pesa Pay Bill Tab**:
  - **Form Fields**:
    - Pay Bill Number (`paybillNumber`)
    - Consumer Key (`consumerKey`)
    - Consumer Secret (`consumerSecret`)
    - Passkey (`passkey`)
  - **Buttons**:
    - `Update`: Saves the form data via a `PUT` request to `/api/settings/mpesa`.
  - **Callback URL Display**:
    - Displays the backend callback URL (e.g., `https://api.yourapp.com/api/payments/c2b-callback`).
    - `Activate M-Pesa` button: Triggers a `POST` request to `/api/settings/mpesa/activate`.

- **M-Pesa Till Tab**:
  - **Form Fields**:
    - Till Store Number (`tillStoreNumber`)
    - Till Number (`tillNumber`)
    - Consumer Key (`consumerKey`)
    - Consumer Secret (`consumerSecret`)
    - Passkey (`passkey`)
  - **Buttons**:
    - `Update`: Saves the form data.
  - **Callback URL Display**:
    - Similar to the Pay Bill tab, displays the relevant callback URL and has an `Activate M-Pesa` button.

## 4. User Flow

1.  The administrator navigates to the "Settings" -> "M-Pesa Gateway" page.
2.  The frontend fetches and displays the currently saved M-Pesa settings.
3.  The admin selects either the "Pay Bill" or "Till" tab.
4.  They fill in or update the required credentials in the form fields.
5.  They click the **"Update"** button. The system saves the credentials to the database and shows a success message.
6.  Next to the callback URL display, the admin clicks the **"Activate M-Pesa"** button.
7.  The system sends a request to the backend, which in turn attempts to register the URL with Safaricom's Daraja API.
8.  The UI displays feedback:
    - **Success**: "Callback URL registered successfully. M-Pesa is now active."
    - **Error**: "Failed to register callback. Error: [Detailed error message from Safaricom]."
