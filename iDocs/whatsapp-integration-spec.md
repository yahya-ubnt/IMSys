# WhatsApp Integration Specification

## 1. Overview

This document outlines the integration of WhatsApp messaging capabilities into the system. The primary purpose is to provide an alternative and potentially richer channel for sending automated reminders, notifications, and potentially other forms of communication to users.

## 2. WhatsApp Business API Provider

Integration will be achieved through the official WhatsApp Business API. This requires partnering with a WhatsApp Business Solution Provider (BSP) (e.g., Twilio, MessageBird, Vonage). The chosen BSP will provide the necessary infrastructure and API endpoints for sending and receiving WhatsApp messages.

## 3. Configuration Parameters

All WhatsApp API credentials and configuration settings will be managed via environment variables, similar to the existing SMS gateway integration. These will be loaded into the backend configuration.

-   **`WHATSAPP_PROVIDER`**: (String) Specifies the WhatsApp BSP to use (e.g., `TWILIO_WHATSAPP`, `MESSAGEBIRD_WHATSAPP`).
-   **`WHATSAPP_API_KEY`**: (String) The primary API key or username for authentication with the WhatsApp BSP.
-   **`WHATSAPP_API_SECRET`**: (String, Optional) The API secret or password for authentication.
-   **`WHATSAPP_PHONE_NUMBER_ID`**: (String) The ID of the WhatsApp Business Account phone number used for sending messages.
-   **`WHATSAPP_ACCOUNT_SID`**: (String, Optional) Specific to providers like Twilio (Account SID).
-   **`WHATSAPP_AUTH_TOKEN`**: (String, Optional) Specific to providers like Twilio (Auth Token).
-   **`WHATSAPP_ENDPOINT_URL`**: (String, Optional) The base URL for the WhatsApp BSP's API endpoint, if not standard.

## 4. Message Types

WhatsApp Business API distinguishes between different message types, which impacts how messages can be sent and initiated.

### 4.1. Template Messages (Highly Structured Messages - HSMs)

-   **Purpose**: Used for outbound notifications and reminders (e.g., expiry alerts, payment confirmations) where the user has not initiated a conversation within the last 24 hours.
-   **Requirement**: Must be pre-approved by WhatsApp. They consist of static text and dynamic placeholders.
-   **Implementation**: The `whatsappService` will need to support sending messages using specific template names and populating their dynamic parameters.

### 4.2. Session Messages

-   **Purpose**: Free-form messages that can be sent in response to a user-initiated conversation within a 24-hour window.
-   **Requirement**: No pre-approval needed, but limited to the 24-hour session.
-   **Implementation**: Less critical for initial reminder functionality, but can be considered for future interactive features.

## 5. Service Layer (`whatsappService.js`)

A dedicated service file (`backend/services/whatsappService.js`) will encapsulate all WhatsApp API interactions.

-   **`sendWhatsAppMessage(recipientPhoneNumber, templateName, templateParameters)`**: Function to send a WhatsApp message using a pre-approved template.
    -   `recipientPhoneNumber`: The WhatsApp number of the recipient.
    -   `templateName`: The name of the pre-approved WhatsApp message template to use.
    -   `templateParameters`: An object or array containing values to populate the dynamic placeholders in the template.
-   **Error Handling and Logging**: The service will capture responses from the WhatsApp BSP, log successful sends, and record failures with detailed error messages.

## 6. Integration Points

Once the `whatsappService` is in place, it can be integrated into various parts of the backend:

-   **Expiry Reminders**: The existing cron job in `server.js` can be modified to send WhatsApp messages in addition to (or instead of) SMS for expiry notifications.
-   **Acknowledgement Messages**: The `sendAcknowledgementSms` function (or a new `sendAcknowledgementWhatsApp` function) can be extended to support WhatsApp based on trigger types.
-   **Compose New Message**: A future enhancement could allow users to compose and send ad-hoc WhatsApp messages (likely requiring a pre-approved template for initial contact).

## 7. Frontend Considerations

-   **Notification Channel Preference**: The frontend UI will need to allow users to select WhatsApp as their preferred notification channel (e.g., in user settings or reminder configurations).
-   **Template Selection**: If users can choose templates, the frontend will need to display available WhatsApp templates.

## 8. User Opt-in and Consent

-   **Crucial Requirement**: Obtaining explicit user consent (opt-in) for receiving WhatsApp messages is mandatory and critical for compliance and avoiding spam. This must be handled on the frontend and stored in the user's profile.
-   **Opt-out Mechanism**: A clear and easy way for users to opt-out of WhatsApp messages must be provided.
