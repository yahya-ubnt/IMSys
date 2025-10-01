# M-Pesa Daraja Integration Specification

This document outlines the specifications for integrating the Safaricom Daraja API for M-Pesa payments, supporting both C2B and STK Push flows.

## 1. Overview

The M-Pesa Daraja integration enables the system to receive and process customer payments automatically. When a customer pays their bill via M-Pesa, the Daraja API sends a notification to our system, which then updates the customer's account and reconnects their service.

## 2. Authentication

Authentication with the Daraja API is done using an OAuth 2.0 access token. The token is valid for one hour and must be regenerated upon expiry.

-   **Authentication URL:**
    -   **Sandbox:** `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
    -   **Production:** `https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
-   **Method:** `GET`
-   **Headers:**
    -   `Authorization`: `Basic <credentials>` where `<credentials>` is the Base64-encoded string of `ConsumerKey:ConsumerSecret`.

The system should cache the access token and refresh it only when it expires.

## 3. C2B (Customer-to-Business) Flow

The C2B flow is initiated by the customer from their M-Pesa-enabled phone.

### 3.1. Registering URLs

Before receiving notifications, the system must register its Confirmation and Validation URLs with Safaricom.

-   **API Endpoint:** `/c2b/v1/registerurl`
-   **Method:** `POST`
-   **Authentication:** Bearer Token (the access token from the authentication step).

-   **Confirmation URL:** This is where Safaricom sends a notification once a transaction is completed. Our system will use this to process the payment.
    -   **Our Endpoint:** `/api/payments/daraja-callback`
-   **Validation URL:** (Optional) Safaricom sends a request to this URL to validate the payment details *before* the customer confirms the payment. This can be used to prevent invalid payments (e.g., for non-existent accounts).

### 3.2. Callback Handling

The system expects to receive a JSON payload from the Daraja API at the Confirmation URL with the following structure:

```json
{
    "TransactionType": "Pay Bill",
    "TransID": "RKTQ48I2G6",
    "TransTime": "20220822103834",
    "TransAmount": "100.00",
    "BusinessShortCode": "600986",
    "BillRefNumber": "account",
    "InvoiceNumber": "",
    "OrgAccountBalance": "",
    "ThirdPartyTransID": "",
    "MSISDN": "254708374149",
    "FirstName": "John",
    "MiddleName": "Doe",
    "LastName": ""
}
```

## 4. STK Push (Lipa Na M-Pesa Online) Flow

The STK Push flow is initiated by our backend and prompts the customer on their phone to enter their M-Pesa PIN.

### 4.1. Password Generation

For each STK Push request, a password must be generated.

-   **Formula:** `Base64.encode(Shortcode + Passkey + Timestamp)`
-   **Shortcode:** Your business shortcode.
-   **Passkey:** The Lipa Na M-Pesa Online passkey obtained from the Safaricom portal.
-   **Timestamp:** The current timestamp in `YYYYMMDDHHMMSS` format.

### 4.2. Initiating the STK Push

The backend will expose an endpoint to initiate the STK Push.

-   **Our Endpoint:** `/api/payments/initiate-stk`
-   **Method:** `POST`
-   **Body:**
    ```json
    {
        "phoneNumber": "2547xxxxxxxx",
        "amount": 10,
        "accountReference": "user_account"
    }
    ```
-   **Backend Logic:**
    1.  Generate the password as described above.
    2.  Call the Safaricom STK Push API (`/mpesa/stkpush/v1/processrequest`).
    3.  The `CallBackURL` in the request to Safaricom will be our existing `/api/payments/daraja-callback` endpoint.

### 4.3. STK Push Callback

The STK Push callback is sent to the same `/api/payments/daraja-callback` endpoint. The payload, however, has a different structure.

```json
{
    "Body": {
        "stkCallback": {
            "MerchantRequestID": "...",
            "CheckoutRequestID": "...",
            "ResultCode": 0,
            "ResultDesc": "The service request is processed successfully.",
            "CallbackMetadata": {
                "Item": [
                    { "Name": "Amount", "Value": 1.00 },
                    { "Name": "MpesaReceiptNumber", "Value": "RKTQ48I2G6" },
                    { "Name": "TransactionDate", "Value": 20220822103834 },
                    { "Name": "PhoneNumber", "Value": 254708374149 }
                ]
            }
        }
    }
}
```

## 5. Processing Logic

When the `/api/payments/daraja-callback` endpoint receives a notification, it performs the following steps:

1.  **Distinguish Callback Type:** The system first checks the payload structure to determine if it's a C2B or STK Push callback.
    -   If the payload contains `TransactionType`, it's a C2B callback.
    -   If the payload contains `Body.stkCallback`, it's an STK Push callback.

2.  **Extract Payment Data:**
    -   **For C2B:** Use `BillRefNumber` as the account and `TransID` as the receipt number.
    -   **For STK Push:** The account reference is not directly available in the callback. The system will need to correlate the `CheckoutRequestID` with the initial STK Push request to retrieve the user's account. The receipt number is `MpesaReceiptNumber`.

3.  **Find the Mikrotik User:** The system uses the extracted account reference to find the corresponding `MikrotikUser`.

4.  **Handle User Not Found:** If no user is found, create a new `MpesaAlert` with the details of the orphaned payment.

5.  **Update Expiry Date:** If the user is found, calculate the new `expiryDate` based on the user's `billingCycle` and update the user's record.

6.  **Reconnect User:** Attempt to reconnect the user's service via the Mikrotik router.

7.  **Handle Reconnection Failure:** If reconnection fails, create a new `MpesaAlert` with payment details and the failure reason.

8.  **Log Successful Transaction:** If reconnection is successful, create a new `MpesaTransaction` record.

9.  **Respond to Daraja API:** Respond with `{"ResultCode": 0, "ResultDesc": "Accepted"}` to acknowledge receipt.

## 6. Environment Handling

The system must be able to switch between Sandbox and Production environments. This will be managed through environment variables.

-   `DARAJA_ENV`: `sandbox` or `production`
-   `DARAJA_CONSUMER_KEY`: The consumer key for the environment.
-   `DARAJA_CONSUMER_SECRET`: The consumer secret for the environment.
-   `DARAJA_SHORTCODE`: The business shortcode.
-   `DARAJA_PASSKEY`: The Lipa Na M-Pesa Online passkey.

The base URL for API calls will be selected based on the `DARAJA_ENV` variable.