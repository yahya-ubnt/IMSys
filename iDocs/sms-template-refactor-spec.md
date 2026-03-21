# SMS Template and Acknowledgement Refactoring Plan

## 1. Objective

This document outlines a plan to refactor the SMS Template and SMS Acknowledgement systems into a single, unified feature. The goal is to simplify the user experience by removing the need to manage templates and their trigger-based acknowledgements in two separate places. This will make the system more intuitive and reduce the chance of misconfiguration.

## 2. Current Implementation

The current system uses two separate Mongoose models:

-   **`SmsTemplate`**: A generic, reusable template containing a `name` and a `messageBody`.
-   **`SmsAcknowledgement`**: A mapping that links a specific `triggerType` (e.g., `payment_received`) to an `SmsTemplate`.

This separation requires a two-step process for users:
1.  Create a template.
2.  Create an acknowledgement to associate that template with a system event (trigger).

This is unnecessarily complex and can be streamlined.

## 3. Proposed Implementation

We will merge the concept of an "acknowledgement" directly into the "template". Each template will be directly associated with a unique trigger.

The new workflow will be:
1.  The user navigates to the "SMS Templates" page.
2.  To create a new template, they select a **Trigger** from a dropdown list.
3.  They then write the message body for that specific trigger and set its status (Active/Inactive).

This creates a one-to-one relationship between a trigger and a template, managed in a single location. The separate `SmsAcknowledgement` model and its corresponding UI will be removed.

## 4. Detailed Changes

### 4.1. Backend

#### 4.1.1. `SmsTemplate` Model (`backend/models/SmsTemplate.js`)

The schema will be updated as follows:

-   **REMOVE** the `name` field.
-   **ADD** a `triggerType` field:
    -   Type: `String`
    -   Required: `true`
    -   Will be an `enum` of available triggers from `backend/constants/smsTriggers.js`.
-   **ADD** a `status` field:
    -   Type: `String`
    -   Enum: `['Active', 'Inactive']`
    -   Default: `'Active'`
-   **UPDATE** the unique index from `(name, tenant)` to `(triggerType, tenant)`.

#### 4.1.2. `smsTemplateController.js`

-   **`createTemplate`**: Will now accept `triggerType`, `messageBody`, and `status`. It will enforce the new uniqueness constraint on `(triggerType, tenant)`.
-   **`updateTemplate`**: Will allow updating `messageBody` and `status`. The `triggerType` will be immutable.
-   **`getTemplates`**: Will return the list of templates with their associated `triggerType` and `status`.

#### 4.1.3. `smsService.js`

-   **`sendAcknowledgementSms`**: This function will be modified to query the `SmsTemplate` collection directly. It will find an active template using `SmsTemplate.findOne({ triggerType, tenant, status: 'Active' })`.

#### 4.1.4. Code Cleanup (Deletions)

The following files and their associated code will be completely removed from the project:
-   `backend/models/SmsAcknowledgement.js`
-   `backend/controllers/smsAcknowledgementController.js`
-   `backend/routes/smsAcknowledgementRoutes.js`

The `server.js` file will be updated to remove the import and usage of `smsAcknowledgementRoutes`.

### 4.2. Frontend

#### 4.2.1. Templates Page (`frontend/src/app/sms/templates/page.tsx`)

-   The main data table will be updated to display the `triggerType` (as a human-readable name, e.g., "Payment Received") and the `status` of the template. The `name` column will be removed.

#### 4.2.2. Template Form (`frontend/src/app/sms/templates/sms-template-form.tsx`)

-   The "Template Name" input field will be removed.
-   A new **`Select` (dropdown)** component will be added for the `triggerType`.
    -   This will be a required field.
    -   The options will be fetched from the backend (e.g., a new API endpoint that returns the available triggers).
    -   When editing a template, this field will be disabled to prevent changing the trigger type.
-   A new **`Switch` or `Select`** component will be added to manage the `status` (Active/Inactive).

### 4.3. Data Migration

**This is a critical step that involves irreversible changes to the database.**

A data migration script will be required to move the existing data to the new schema. I will provide the script, but **it must be reviewed and executed manually by the system administrator.**

The migration script will perform the following steps:
1.  Fetch all documents from the `smsacknowledgements` collection.
2.  For each acknowledgement, fetch the related `smstemplate` document using the `smsTemplate` reference.
3.  Create a **new** document in the `smstemplates` collection with the following mapping:
    -   `newTemplate.triggerType` = `acknowledgement.triggerType`
    -   `newTemplate.messageBody` = `oldTemplate.messageBody`
    -   `newTemplate.status` = `acknowledgement.status`
    -   `newTemplate.tenant` = `acknowledgement.tenant`
4.  After verifying the successful creation of the new templates, the `smsacknowledgements` collection can be dropped. The old templates in the `smstemplates` collection that were successfully migrated can also be removed.
