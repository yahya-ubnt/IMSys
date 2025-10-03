# WhatsApp Integration Specification (v2.0)

## 1. Objective

To implement a flexible, multi-provider WhatsApp messaging capability within the application. This system will allow administrators to configure and manage WhatsApp Business Solution Providers (BSPs) from the settings panel, providing a rich channel for automated notifications, customer support, and user engagement.

## 2. Key Features

- **UI-Driven Configuration:** Replaces the previous `.env`-based setup. Administrators will manage providers entirely through a new "WhatsApp" tab in the settings UI.
- **Multi-Provider Support:** Allows for configuring multiple BSPs (e.g., Twilio, Vonage), with one designated as "active" for sending messages.
- **Secure Credential Storage:** All API keys and tokens will be encrypted in the database.
- **Extensible Driver Architecture:** A modular backend pattern will make it simple to add new WhatsApp providers in the future.
- **Template-Based Messaging:** The core service will focus on sending pre-approved, templated messages, which is the standard for business-initiated conversations on WhatsApp.

## 3. Backend Implementation

The backend will be architected identically to the new SMS provider system for consistency and maintainability.

### 3.1. Database Model: `WhatsAppProvider`

A new Mongoose model will be created to store provider configurations.

**File:** `backend/models/WhatsAppProvider.js`

**Schema:**

| Field         | Type          | Description                                                              | Required | Notes                                                                    |
|---------------|---------------|--------------------------------------------------------------------------|----------|--------------------------------------------------------------------------|
| `name`        | String        | A unique, user-friendly name for the configuration.                      | Yes      | Unique                                                                   |
| `providerType`| String        | An enum identifying the provider driver (e.g., `twilio`).                | Yes      |                                                                          |
| `credentials` | Mixed (Object)| An encrypted JSON object holding the provider-specific credentials.      | Yes      | Getter/setter will handle encryption/decryption.                         |
| `isActive`    | Boolean       | If `true`, this provider is used for sending all WhatsApp messages.      | No       | Default: `false`. Middleware will enforce a single active provider.      |

### 3.2. API Endpoints

New CRUD endpoints will be created under `/api/settings/whatsapp-providers`.

| Method | Endpoint                                  | Description                                  | Access  |
|--------|-------------------------------------------|----------------------------------------------|---------|
| `POST` | `/api/settings/whatsapp-providers`        | Add a new WhatsApp provider configuration.   | Private |
| `GET`  | `/api/settings/whatsapp-providers`        | Get a list of all configured providers.      | Private |
| `PUT`  | `/api/settings/whatsapp-providers/:id`    | Update a provider's configuration.           | Private |
| `DELETE`| `/api/settings/whatsapp-providers/:id`    | Delete a provider configuration.             | Private |
| `POST` | `/api/settings/whatsapp-providers/:id/set-active`| Set a provider as the active one.       | Private |

### 3.3. Service Layer Refactoring (`whatsappService.js`)

The existing service will be refactored to use the new database model.

- **`sendWhatsAppMessage(recipientPhoneNumber, templateName, templateParameters)`**: This function will be updated to:
  1. Query the `WhatsAppProvider` model to find the active provider.
  2. Decrypt its credentials.
  3. Load the appropriate driver from the `whatsappDrivers` directory.
  4. Pass the details to the driver for sending.

### 3.4. Driver Architecture

- A new directory will be created: `backend/services/whatsappDrivers/`.
- **Initial Support:** The first driver will be for **Twilio for WhatsApp**, as it is a widely-used and well-documented BSP.
- **File:** `backend/services/whatsappDrivers/twilio.js` will contain the specific logic to interact with the Twilio API for sending templated WhatsApp messages.

## 4. Frontend Implementation

A new, dedicated section for WhatsApp will be added to the main application sidebar, providing a centralized hub for all related features.

- **Main Sidebar Navigation:**
  - A new top-level menu item, **"WhatsApp"**, will be added.
  - This menu item will have three sub-menus:
    1.  **Templates:** Leads to the WhatsApp Template management page.
    2.  **Compose:** Leads to the page for composing and sending new messages.
    3.  **Sent Log:** Leads to the page for viewing the history of sent messages.

- **New Pages:**
  - **WhatsApp Template Management Page:** A new page will be created for CRUD operations on `WhatsAppTemplate` entities. Users will be able to view, add, edit, and delete their pre-approved message templates here.
  - **Compose Page:** This page will contain the UI for selecting a target audience (users, groups, etc.), choosing a template, filling in variables, and sending the message.
  - **Sent Log Page:** This page will display the `WhatsAppLog` data in a filterable and paginated table.

- **Settings Tab (Configuration):**
  - The configuration of WhatsApp providers (adding Twilio, etc.) will still reside in the **Settings** page, under its own **"WhatsApp" tab**, as previously designed. This separates the one-time setup from the daily-use operational tools.

## 5. Expanded Use Cases for WhatsApp

To enhance the application's value, WhatsApp can be integrated at several key points:

- **Automated Notifications:**
  - **Payment Reminders & Expiry Alerts:** Send alerts to users who have opted-in, providing a richer experience than SMS.
  - **Payment Confirmations:** Instantly send a confirmation message when a payment is successfully received and applied.
  - **New Bill Notifications:** Alert users when a new monthly bill has been generated.

- **Customer Support & Ticketing:**
  - **Ticket Creation Confirmation:** When a user raises a ticket, send an immediate WhatsApp message confirming receipt with the ticket number.
  - **Ticket Status Updates:** Notify users when their ticket status changes (e.g., "An agent is now looking at your issue," or "Your issue has been resolved.").

- **User Onboarding & Engagement:**
  - **Welcome Message:** Send a welcome message to new users upon registration, with a link to the client portal and a brief guide.
  - **Diagnostic Notifications:** Inform a user when a diagnostic check they initiated has been completed, with a summary of the results.

## 6. Compliance and User Consent

- **Explicit Opt-In:** A mechanism must be created (e.g., a checkbox in the user's profile) for users to explicitly consent to receiving WhatsApp communications. This is a strict requirement of the WhatsApp platform.
- **Easy Opt-Out:** Users must have a clear and simple way to unsubscribe from WhatsApp messages.
