# SMS Provider Integration Specification

## 1. Objective

To refactor the existing SMS service to support multiple SMS gateway providers. This will allow an administrator to add, configure, and switch between different providers from the application's settings panel without requiring code changes or application restarts.

## 2. Key Features

- **Multi-Provider Support:** The system will be designed to support multiple providers simultaneously, with one designated as "active" for sending.
- **Dynamic Configuration:** Administrators can add, edit, and delete provider configurations through the UI.
- **Secure Credential Storage:** All sensitive credentials (API keys, tokens, etc.) will be encrypted in the database.
- **Extensible Driver Architecture:** The backend will use a modular "driver" pattern, making it simple to add new providers in the future.
- **Initial Provider Support:** The initial implementation will include support for:
  - Celcom Africa (`celcom`)
  - Africa's Talking (`africastalking`)
  - Twilio (`twilio`)
  - A Generic HTTP option (`generic_http`) for other providers that use a simple webhook.

## 3. Backend Implementation

### 3.1. Database Model: `SmsProvider`

A new Mongoose model will be created to store provider configurations.

**File:** `backend/models/SmsProvider.js`

**Schema:**

| Field         | Type          | Description                                                                                             | Required | Notes                                                                                              |
|---------------|---------------|---------------------------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------|
| `name`        | String        | A unique, user-friendly name for the configuration (e.g., "Celcom Primary").                            | Yes      | Unique                                                                                             |
| `providerType`| String        | An enum identifying the provider driver. e.g., `celcom`, `africastalking`, `twilio`, `generic_http`.      | Yes      |                                                                                                    |
| `credentials` | Mixed (Object)| An encrypted JSON object holding the provider-specific credentials.                                     | Yes      | Getter/setter will handle encryption/decryption.                                                   |
| `isActive`    | Boolean       | If `true`, this provider is used for sending all SMS. Only one provider can be active at a time.         | No       | Default: `false`. Middleware will enforce a single active provider.                                |
| `createdAt`   | Date          | Timestamp of creation.                                                                                  | -        | Managed by Mongoose timestamps.                                                                    |
| `updatedAt`   | Date          | Timestamp of last update.                                                                               | -        | Managed by Mongoose timestamps.                                                                    |

### 3.2. API Endpoints

New CRUD endpoints will be created for managing SMS providers.

**Route File:** `backend/routes/smsProviderRoutes.js` (or similar, integrated into settings routes)

| Method | Endpoint                               | Description                                | Access  |
|--------|----------------------------------------|--------------------------------------------|---------|
| `POST` | `/api/settings/sms-providers`          | Add a new SMS provider configuration.      | Private |
| `GET`    | `/api/settings/sms-providers`          | Get a list of all configured providers.    | Private |
| `GET`    | `/api/settings/sms-providers/:id`      | Get a single provider's details.           | Private |
| `PUT`    | `/api/settings/sms-providers/:id`      | Update a provider's configuration.         | Private |
| `DELETE` | `/api/settings/sms-providers/:id`      | Delete a provider configuration.           | Private |
| `POST`   | `/api/settings/sms-providers/:id/set-active` | Set a provider as the active one.      | Private |

### 3.3. Service Layer Refactoring

- **`smsService.js`:**
  - The main `sendSMS` function will be modified.
  - It will no longer read from `.env` variables for provider details.
  - Instead, it will query the `SmsProvider` model to find the document where `isActive: true`.
  - It will decrypt the credentials and pass them, along with the message, to the appropriate driver.

- **`smsDrivers` Directory:**
  - A new directory will be created: `backend/services/smsDrivers/`.
  - Each provider will have its own file (e.g., `celcom.js`, `africastalking.js`).
  - Each driver file will export a single function, e.g., `sendMessage(credentials, phoneNumber, message)`, which contains the provider-specific `axios` call and logic.

## 4. Frontend Implementation

The frontend implementation will mirror the structure and style of the existing settings page to ensure a consistent user experience. The new UI will be located in a new "SMS" tab next to the "M-Pesa" tab.

### 4.1. File and Component Structure

- **Main Settings Page (`frontend/src/app/settings/page.tsx`):**
  - A new tab configuration will be added to the `tabs` array:
    ```javascript
    { id: "sms", label: "SMS", icon: MessageSquare } // MessageSquare from lucide-react
    ```
  - A new `StyledTabsContent` block will be added to render the main SMS settings component.

- **New SMS Settings Component (`frontend/src/app/settings/sms/page.tsx`):**
  - This new file will be created to house the main component for SMS provider settings.
  - It will be responsible for fetching the list of configured providers and rendering the `SmsProviderList` and `SmsProviderForm` components.

### 4.2. UI Components and Layout

The UI will consist of two main components, styled with the project's existing Tailwind CSS classes and custom UI components (`Card`, `Button`, `Input`, `Table`, etc.).

- **`SmsProviderList` Component:**
  - This component will display the configured SMS providers in a table or a list of cards.
  - **Columns/Fields:** `Name`, `Provider Type`, `Status (Active/Inactive)`.
  - **Actions:** Each row will feature "Edit", "Delete", and "Set Active" buttons.
  - A prominent "Add New Provider" button will be displayed above the list.

- **`SmsProviderForm` Component (Modal or Inline):**
  - This form will be used for both adding and editing providers.
  - **Provider Type Selection:** A `<Select>` dropdown will allow the user to choose the provider (`Celcom Africa`, `Africa's Talking`, `Twilio`, `Generic HTTP`).
  - **Dynamic Credential Fields:** Based on the `providerType` selected, the form will dynamically render the appropriate input fields. This is crucial for a good user experience.
    - **If `Celcom Africa`:**
      - `API Key` (Input, text)
      - `API Secret` (Input, password)
      - `Sender ID` (Input, text)
    - **If `Africa's Talking`:**
      - `Username` (Input, text)
      - `API Key` (Input, password)
      - `Sender ID` (Input, text)
    - **If `Twilio`:**
      - `Account SID` (Input, text)
      - `Auth Token` (Input, password)
      - `From Number` (Input, text, e.g., +1234567890)
    - **If `Generic HTTP`:**
      - `Endpoint URL` (Input, text)
      - `API Key` (Input, password)
      - `Sender ID` (Input, text)
  - The form will include "Save" and "Cancel" buttons.

### 4.3. Styling and Conformance

- All new components will strictly adhere to the existing design language.
- They will reuse existing styled components like `<Card>`, `<Button>`, `<Input>`, `<Select>`, and table components from the project's UI library.
- Icons will be sourced from `lucide-react` to maintain visual consistency.
- Layout and spacing will be managed with Tailwind CSS utility classes, following the patterns seen in `GeneralSettingsForm` and `MpesaSettingsPage`.

## 5. Security

- The `ENCRYPTION_KEY` environment variable must be set to a secure, 32-byte (64-character hex) random string. This key is critical for securing the provider credentials.
- API endpoints for managing providers must be protected and accessible only to authorized administrators.
