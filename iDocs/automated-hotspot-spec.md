# Automated Hotspot with M-Pesa STK Push

This document outlines the specification for a fully automated hotspot system that allows users to connect to a Wi-Fi network, purchase a plan via M-Pesa STK push, and gain internet access automatically.

## 1. User Flow

1.  A user connects to the Wi-Fi network provided by an access point.
2.  The user's traffic is passed to a Mikrotik router, which acts as the gateway.
3.  The Mikrotik router intercepts the user's connection and automatically redirects them to our custom captive portal.
4.  The router passes the user's MAC address and its own IP address to the captive portal as URL parameters.
5.  The captive portal loads and fetches a list of available hotspot plans from our backend API, specific to the Mikrotik router they are connected through.
6.  The user selects a plan.
7.  A modal or a form appears, prompting the user to enter their M-Pesa phone number.
8.  The user enters their phone number and clicks "Pay."
9.  An STK push notification is sent to the user's phone.
10. The user enters their M-Pesa PIN to authorize the payment.
11. Upon successful payment, the user is automatically granted internet access without needing to enter a username or password.

## 2. System Architecture

The system will consist of the following components:

*   **Mikrotik Router:** Configured to use a custom captive portal and to pass the user's MAC address and its own IP address to the portal.
*   **Custom Captive Portal:** A web page that displays hotspot plans for the specific router, captures the user's phone number, and initiates the payment process.
*   **Backend API:** An API that provides a list of hotspot plans, handles the M-Pesa STK push integration, and communicates with the Mikrotik router to grant internet access.

## 3. Implementation Details

### 3.1. Mikrotik Configuration

*   The Mikrotik router will be configured to use an external captive portal. This will be our custom captive portal, hosted on our server.
*   The router will be configured to pass the user's MAC address and its own IP address to the captive portal as URL parameters. For example: `http://our-server.com/hotspot/portal?mac_address=...&router_ip=...`

### 3.2. Custom Captive Portal

*   The captive portal will be a single-page application (SPA) built with React or a similar framework.
*   It will extract the `router_ip` from the URL parameters.
*   It will fetch the list of available hotspot plans from a public API endpoint, passing the `router_ip` as a query parameter.
*   When a user selects a plan and enters their phone number, the portal will make a request to the backend API to initiate the STK push.
*   The portal will display a "waiting for payment" message to the user while the payment is being processed.
*   After a successful payment, the portal will display a success message and the user will be automatically granted internet access.

### 3.3. Backend API

The backend API will have the following new endpoints:

#### 3.3.1. `GET /api/hotspot/public/plans`

*   **Description:** Returns a list of all active hotspot plans for a specific Mikrotik router. This endpoint will be public and will not require authentication.
*   **Query Parameters:**
    *   `router_ip` (required): The IP address of the Mikrotik router.
*   **Response:**
    ```json
    [
      {
        "_id": "...",
        "name": "1 Hour Pass",
        "price": 50,
        "timeLimitValue": 1,
        "timeLimitUnit": "hours",
        "dataLimitValue": 0,
        "dataLimitUnit": "GB"
      },
      ...
    ]
    ```

#### 3.3.2. `POST /api/hotspot/stk-push`

*   **Description:** Initiates an M-Pesa STK push to the user's phone.
*   **Request Body:**
    ```json
    {
      "planId": "...",
      "phoneNumber": "...",
      "macAddress": "..."
    }
    ```
*   **Logic:**
    1.  This endpoint will reuse the existing M-Pesa STK push logic.
    2.  It will create a new `HotspotTransaction` record with a `status` of "pending" and associate it with the user's MAC address.

#### 3.3.3. `POST /api/hotspot/callback`

*   **Description:** This is the webhook endpoint that M-Pesa will call to notify us of a successful payment.
*   **Logic:**
    1.  When a successful payment is confirmed, it will find the corresponding `HotspotTransaction` record.
    2.  It will then use the Mikrotik API to add the user's MAC address to the IP bindings with `type=bypassed`.
    3.  It will create a new `HotspotSession` record with the session details.
    4.  It will update the `HotspotTransaction` record with a `status` of "completed."

### 3.4. Data Models

*   **`HotspotTransaction`:** A new model to store hotspot-specific transactions.
*   **`HotspotSession`:** A new model to track user sessions.

## 4. Session Management and Plan Expiration

While the Mikrotik router will enforce the time and data limits of the hotspot plan, the application will be responsible for managing the user's session and providing a seamless user experience upon plan expiration.

### 4.1. Session Tracking

*   A new `HotspotSession` model will be created to track user sessions. This model will include:
    *   `macAddress`: The user's MAC address.
    *   `planId`: The ID of the hotspot plan purchased by the user.
    *   `startTime`: The time the session started.
    *   `endTime`: The time the session is scheduled to end.
    *   `dataUsage`: The user's data usage (updated periodically).

### 4.2. Plan Expiration

*   When a user's plan expires, the Mikrotik router will automatically disconnect them.
*   When the user reconnects, they will be redirected to the captive portal.
*   The captive portal will make a request to a new API endpoint (`GET /api/hotspot/session/:macAddress`) to get the status of the user's session.
*   If the session has expired, the captive portal will display a message indicating that the plan has expired and will provide the option to purchase a new plan.

### 4.3. Re-purchasing

*   When a user with an expired session purchases a new plan, the application will:
    1.  Create a new `HotspotTransaction`.
    2.  Upon successful payment, update the existing `HotspotSession` record with the new plan details and session times.
    3.  Update the user's IP binding on the Mikrotik router to reflect the new plan.

## 5. User Experience

*   The user experience should be as seamless as possible.
*   The captive portal should be simple, intuitive, and mobile-friendly.
*   The user should receive clear feedback at each step of the process (e.g., "waiting for payment," "payment successful").

## 6. Future Considerations

*   **Automatic Reconnection:** If a user disconnects and reconnects to the Wi-Fi within their plan's time and data limits, they will be automatically granted internet access without being redirected to the captive portal.
*   **Promotions:** We can offer promotions and discounts to users.

## 7. Implementation Plan

### Phase 1: Backend API Development

*   **Goal:** Create the necessary API endpoints and database models to support the automated hotspot system.
*   **Steps:**
    1.  **Create `HotspotTransaction` Model:**
        *   Create a new file `backend/models/HotspotTransaction.js`.
        *   Define the `HotspotTransaction` schema with the fields: `planId`, `phoneNumber`, `macAddress`, `amount`, and `status`.
    2.  **Create `HotspotSession` Model:**
        *   Create a new file `backend/models/HotspotSession.js`.
        *   Define the `HotspotSession` schema with the fields: `macAddress`, `planId`, `startTime`, `endTime`, and `dataUsage`.
    3.  **Create `GET /api/hotspot/public/plans` Endpoint:**
        *   In `backend/controllers/hotspotPlanController.js`, create a new controller function called `getPublicHotspotPlans`.
        *   This function will accept a `router_ip` query parameter, find the corresponding `MikrotikRouter`, and return the associated `HotspotPlan`s.
        *   In `backend/routes/hotspotPlanRoutes.js`, create a new route `GET /public/plans` that maps to the `getPublicHotspotPlans` controller function.
    4.  **Create `POST /api/hotspot/stk-push` Endpoint:**
        *   Create a new file `backend/controllers/hotspotStkController.js`.
        *   Create a new controller function called `initiateStkPush` that accepts `planId`, `phoneNumber`, and `macAddress`, reuses the existing M-Pesa STK push logic, and creates a new `HotspotTransaction`.
        *   Create a new file `backend/routes/hotspotStkRoutes.js` and a new route `POST /stk-push` that maps to the `initiateStkPush` controller function.
        *   In `backend/server.js`, add the new route: `app.use('/api/hotspot', hotspotStkRoutes);`
    5.  **Create a New `POST /api/hotspot/callback` Endpoint:**
        *   In `backend/controllers/hotspotStkController.js`, create a new controller function called `handleHotspotCallback`.
        *   This function will handle the M-Pesa callback, find the `HotspotTransaction`, update the user's IP binding on the Mikrotik router, create a `HotspotSession`, and update the transaction status.
        *   In `backend/routes/hotspotStkRoutes.js`, create a new route `POST /callback` that maps to the `handleHotspotCallback` controller function.
    6.  **Create `GET /api/hotspot/session/:macAddress` Endpoint:**
        *   Create a new file `backend/controllers/hotspotSessionController.js` and a controller function called `getSessionStatus`.
        *   Create a new file `backend/routes/hotspotSessionRoutes.js` and a route `GET /session/:macAddress` that maps to the `getSessionStatus` controller function.
        *   In `backend/server.js`, add the new route: `app.use('/api/hotspot', hotspotSessionRoutes);`

### Phase 2: Frontend Captive Portal Development

*   **Goal:** Build the custom captive portal that users will interact with.
*   **Steps:**
    1.  **Create Captive Portal Page:**
        *   Create a new file `frontend/src/app/hotspot/portal/page.tsx`.
    2.  **Build the UI:**
        *   Build the UI for the captive portal using React and Tailwind CSS.
    3.  **Implement the Logic:**
        *   Extract `router_ip` and `mac_address` from the URL.
        *   Fetch plans from `GET /api/hotspot/public/plans`.
        *   Initiate STK push with `POST /api/hotspot/stk-push`.
        *   Poll `GET /api/hotspot/session/:macAddress` to check for session status.

### Phase 3: Mikrotik Configuration

*   **Goal:** Configure the Mikrotik router to use our custom captive portal.
*   **Steps:**
    1.  **Host Captive Portal:**
        *   Host the captive portal on our server.
    2.  **Configure Hotspot Server Profile:**
        *   Point the Mikrotik router's hotspot server profile to our external portal URL.
        *   Configure the router to pass the `mac-address` and `router-ip` to the portal URL.
