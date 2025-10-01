# Payment Integration Specification

This document outlines the specifications for integrating various payment gateways into the system. The integration is designed as a step-by-step wizard to guide the user through the setup process for their chosen payment method.

## 1. Supported Payment Gateways

The system will support the following payment gateways:

-   Safaricom Paybill (Daraja)
-   Safaricom Till
-   KopoKopo Till
-   ZenoPay

## 2. Configuration Wizard Flow

The user will be presented with a wizard to configure their desired payment gateway.

-   **Step 1: Select Payment Type**
    -   The user selects one of the supported payment gateways from a list.

-   **Step 2: Gateway-Specific Configuration**
    -   Based on the selection, the user is presented with specific configuration steps for that gateway.

---

## 3. Safaricom Paybill (Daraja) Integration

This section details the configuration flow for the Safaricom Paybill gateway, which uses the Daraja API. For full technical details of the API interaction, see the [M-Pesa Daraja Integration Specification](./mpesa-daraja-spec.md).

### 3.1. User Configuration Wizard

**Step 1: Do you have your own Paybill?**

-   The user is presented with a toggle switch.
    -   **Default State:** `No`
    -   **`No` selected:** The user proceeds to a flow to configure forwarding payments to their desired recipient.
    -   **`Yes` selected:** The user proceeds to the next step to enter their own credentials.

**Step 2 (No Flow): Configure Payment Recipient**

If the user toggles "No," they are prompted to specify where payments should be sent.

-   **Recipient Type:**
    -   **Type:** Dropdown Select
    -   **Options:** `Bank Account`, `Till Number`, `Phone Number`

-   **If `Bank Account` is selected:**
    -   **Bank:**
        -   **Type:** Dropdown Select
        -   **Options:** ABC Bank, ABSA, Cooperative Bank, Diamond Trust Bank, Eco Bank Kenya, Equity Bank, Family Bank, I and M Bank, KCB Bank, NCBA, National Bank, CBN, Standard Chartered, Standard Bank.
    -   **Bank Paybill:**
        -   **Type:** Text Input (Read-only, Auto-populated)
        -   **Description:** The official Paybill number for the selected bank. This field is automatically filled based on the bank selection.
    -   **Bank Account Number:**
        -   **Type:** Text Input (Numeric)
        -   **Description:** The user's bank account number.

-   **If `Till Number` is selected:**
    -   *(To be detailed)*

-   **If `Phone Number` is selected:**
    -   *(To be detailed)*

**Step 2 (Yes Flow): Enter Your Daraja Credentials**

If the user toggles "Yes," they are prompted to enter the following information:

-   **Paybill Number:**
    -   **Type:** Text Input (Numeric)
    -   **Description:** The company's official Safaricom Paybill number.
-   **Consumer Key:**
    -   **Type:** Text Input (Password/Secret)
    -   **Description:** The Consumer Key obtained from the Safaricom Daraja developer portal.
-   **Consumer Secret:**
    -   **Type:** Text Input (Password/Secret)
    -   **Description:** The Consumer Secret obtained from the Safaricom Daraja developer portal.
-   **Passkey:**
    -   **Type:** Text Input (Password/Secret)
    -   **Description:** The Lipa Na M-Pesa Online passkey from the Safaricom portal.
-   **Company Name:**
    -   **Type:** Text Input
    -   **Description:** The company name associated with the Paybill.

**Step 3: Confirmation**

-   The user reviews the entered details and confirms.
-   The system will securely store these credentials and use them for processing payments as described in the `mpesa-daraja-spec.md`.

---

## 4. Safaricom Till Integration

*(To be detailed)*

---

## 5. KopoKopo Till Integration

*(To be detailed)*

---

## 6. ZenoPay Integration

*(To be detailed)*
