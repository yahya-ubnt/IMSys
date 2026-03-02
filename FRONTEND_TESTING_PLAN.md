# Frontend E2E Testing Plan

This document tracks the End-to-End (E2E) verification of the IMSys Frontend. Our goal is to ensure every page is functional, correctly connected to the backend, and provides a smooth user experience.

## Testing Strategy
We use **Playwright** to simulate real user interactions in a headless browser. Each test verifies:
1.  **Accessibility:** Can the page be reached?
2.  **Data Loading:** Does it fetch and display data from the backend?
3.  **Interactivity:** Do forms, buttons, and filters work?
4.  **Comprehensive Scope:** For each major feature or entity, testing includes the full **CRUD (Create, Read, Update, Delete)** lifecycle and **exhaustive form validation** across all input forms (creation, editing, settings, etc.). This covers:
    *   Required fields.
    *   Invalid data types (e.g., text in number fields).
    *   Out-of-range values.
    *   Specific format validations (e.g., email, phone, IP addresses).
    *   Correct display of backend-driven validation errors (e.g., duplicate entries, business logic conflicts).

---

## Mocking Strategy for E2E Tests

To ensure repeatability, speed, and isolation, our E2E tests will follow a specific mocking strategy:

1.  **Your Backend API Endpoints:** E2E tests will interact with your **actual backend API endpoints**, which in turn connect to a **real (but isolated) test database**. This verifies your full stack from frontend to your database.
2.  **External Third-Party Services (M-Pesa, SMS, Mikrotik Hardware):** All calls from your backend to *external* services will be **intercepted and mocked**. This means:
    *   When the frontend triggers an M-Pesa STK push, your backend calls a *mocked* M-Pesa API that returns a predefined success/failure.
    *   When your backend needs to send an SMS, it interacts with a *mocked* SMS gateway.
    *   When your backend needs to configure a Mikrotik router (add user, disconnect), it interacts with a *mocked* Mikrotik API client.
    This ensures tests are deterministic, fast, and don't rely on real-world external systems.

---

## E2E Checklist

### Phase 0: The "Smoke" Flow (Simplest Verification)
- [x] **"Happy Path" Access:**
    1. Open Browser to `/login`.
    2. Enter Admin credentials.
    3. Click "Login".
    4. Verify redirection to `/admin/dashboard`.
    5. Check if "Total Users" card is visible. (Verified: Login Page loads and hydrates correctly)

### Phase 1: Authentication & Core
- [x] **Login Page** (Verified: Valid credentials redirect correctly)
- [ ] **Registration Page** (New tenant onboarding)
- [x] **Main Dashboard** (Verified: Stats cards and charts load data from backend)

### Phase 1.5: Super Admin - Tenant Onboarding
- [ ] **Login as Super Admin**
- [ ] **Navigate to Tenant Management**
- [ ] **Tenant Creation Form:**
    - [ ] **Validation:** Submit empty form and verify errors.
    - [ ] **Validation:** Enter an invalid email and verify error.
    - [ ] **Success:** Create a new Tenant with an Admin user.
    - [ ] Verify the new Tenant appears in the list.
- [ ] **Logout**
- [ ] **Login as New Tenant Admin:**
    - [ ] Verify successful login.
    - [ ] Verify dashboard shows empty stats (0 users, 0 routers).
    - [ ] **Data Isolation:** Attempt to access a URL for another tenant's resource (e.g., `/mikrotik/users/[some_other_id]`) and verify a "Not Found" or "Forbidden" error.

### Phase 2: Tenant Admin - Initial Setup
- [ ] **Login as Tenant Admin**
- [ ] **Network Setup - Routers:**
    - [ ] Navigate to `Mikrotik -> Routers -> New`.
    - [ ] **Validation:** Test form with invalid IP and missing fields.
    - [ ] **Success:** Create a new Mikrotik Router.
    - [ ] Verify the router appears in the list.
    - [ ] **Connection Test:** Trigger the "Test Connection" and verify success toast.
- [ ] **Network Setup - Devices (Antennas/Stations):**
    - [ ] Navigate to `Devices -> New`.
    - [ ] Create a new Device (e.g., a "Station").
- [ ] **Network Diagnostics:**
    - [ ] **Admin Runs Diagnostic and Views Report:**
        -   Given: A logged-in Tenant Admin.
        -   When: The admin navigates to a user's detail page (`/mikrotik/users/[id]/details`) and clicks "Run Diagnostic".
        -   And: The test intercepts the API calls to provide predictable mock data for both the diagnostic trigger and the report content.
        -   Then: The user is redirected to the diagnostic report page.
        -   And: The UI correctly renders the visual timeline (e.g., `Core [UP] -> Sector [UP] -> Station [DOWN]`).
        -   And: Correct icons and colors are displayed for each step.
- [ ] **Service Setup - Packages:**
    - [ ] Navigate to `Mikrotik -> Packages -> New`.
    - [ ] **Validation:** Test form with missing price/name.
    - [ ] **Success:** Create a PPPoE package linked to the router from the previous step.
    - [ ] Verify the package appears in the list.

### Phase 3: Tenant Admin - Subscriber (Mikrotik User) Lifecycle
- [ ] **Subscriber Onboarding:**
    - [ ] Navigate to `Mikrotik -> Users -> New`.
    - [ ] **Step 1 Validation:** Attempt to click "Next" without filling out Router/Service/Package.
    - [ ] Fill Step 1 details (select the router and package created above).
    - [ ] **Step 2 Validation:** Test form with invalid mobile number, missing name, etc.
    - [ ] **Success:** Fill all details for a new subscriber and submit.
    - [ ] Verify the new user appears in the `Mikrotik -> Users` list.
    - [ ] **Verification:** Check the `Transactions` page to ensure the initial billing record/invoice was created.
- [ ] **Subscriber Financials - Manual Payment:**
    - [ ] Navigate to `Payments -> Cash Purchase`.
    - [ ] Select the user created above.
    - [ ] **Validation:** Enter non-numeric amount.
    - [ ] **Success:** Submit a partial payment for the user.
    - [ ] Verify the transaction appears in the user's detailed view (`/mikrotik/users/[id]`).
    - [ ] Verify the user's balance is correctly updated.
- [ ] **Subscriber Disconnection/Grace Period (Manual Trigger):**
    - [ ] Go to the user's detail page.
    - [ ] Manually set the expiry date to yesterday.
    - [ ] Verify the user's status changes to "Expired".
    - [ ] (Backend Verification) Check if the user was disconnected on the Mikrotik (this part may need a mock or a special verification endpoint).

### Phase 4: CRM & Support
- [ ] **Leads Management:**
    - [ ] Navigate to `Leads -> New`.
    - [ ] Create a new lead.
    - [ ] Verify lead is in the list.
    - [ ] **Conversion:** Convert the Lead to a Mikrotik User.
    - [ ] Verify the new user appears in the `Mikrotik -> Users` list.
- [ ] **Ticket Management:**
    - [ ] Navigate to `Tickets -> New`.
    - [ ] Create a new ticket for an existing subscriber.
    - [ ] Verify ticket appears in the list.
    - [ ] Open the ticket, add a note, and resolve it.

### Phase 5: System Configuration & Communication
- [ ] **General Settings:**
    - [ ] Navigate to `Settings -> General`.
    - [ ] Update the "Company Name".
    - [ ] Verify the name is updated in the UI (e.g., sidebar).
- [ ] **M-Pesa Settings:**
    - [ ] Navigate to `Settings -> M-Pesa`.
    - [ ] Fill and save credentials.
    - [ ] Verify the inputs are masked and saved correctly (by checking if they persist on page reload).
- [ ] **SMS Module:**
    - [ ] Navigate to `SMS -> Compose`.
    - [ ] Send a single SMS to a user.
    - [ ] Check the `SMS -> Sent` log to verify the message was recorded.

---

## Progress Summary
- **Verified Pages:** 0
- **Broken/Issues:** 0
- **Total Coverage:** 0%
