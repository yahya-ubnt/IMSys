# Diagnostic Check Feature Specification (v2)

## 1. Overview

This document outlines the specification for a "Diagnostic Check" feature. The goal is to provide support staff with a powerful, one-click tool to rapidly troubleshoot a customer's connectivity issues. The feature is accessible from a Mikrotik client's detail page and presents its findings in a visually intuitive, real-time interface.

## 2. UI/UX Design (Frontend)

The user interface is designed to be modern, dynamic, and easy to interpret, giving a "mission control" feel to the diagnostic process.

### 2.1. Frontend Component Architecture

The feature is composed of three main components:

-   **`DiagnosticButton.tsx`**: A button on the user detail page that initiates the live diagnostic. It communicates the start and completion of the check to its parent page.
-   **`DiagnosticHistory.tsx`**: A component that fetches and displays a table of all past diagnostic runs for the user. It includes a "View Report" button for each entry.
-   **`DiagnosticModal.tsx`**: A single, reusable modal component used to display both the results of a live run and the details of a historical report.

State management (e.g., modal visibility, the currently displayed report) is handled by the parent page, `app/mikrotik/users/[id]/details/page.tsx`.

### 2.2. User Flow

1.  **Run a Live Diagnostic:**
    -   The user clicks the **"Run Diagnostic"** button.
    -   A modal appears, showing a "Running checks..." loading state.
    -   When the backend responds, the modal is populated with a step-by-step breakdown of the results and a final conclusion.
2.  **View a Past Report:**
    -   The user clicks the **"View Report"** button in the "Diagnostic History" table.
    -   The same modal appears, populated with the data from that historical log entry.

### 2.3. Report Display

The modal displays the report in a clear, hierarchical format:

-   **Top-Level Conclusion:** A summary card at the top provides the most likely cause of the issue.
-   **Checks Performed:** A vertical stepper/timeline component shows the outcome of each diagnostic step (e.g., Billing, Router Check, Client Status) with clear icons (Success, Failure, Warning).
-   **Neighbor Analysis:** If applicable, two cards display the lists of "Online Neighbors" and "Offline Neighbors" on the same CPE.

### 2.4. Accessibility

-   The dialog component includes a `<DialogDescription>` to ensure it is announced correctly by screen readers, resolving potential accessibility warnings.

## 3. Backend Architecture

### 3.1. API Endpoints

The routes are mounted under the existing Mikrotik user routes to ensure correct pathing and middleware application.

-   **Initiate Diagnostic:**
    -   `POST /api/mikrotik/users/:userId/diagnostics`
    -   **Middleware:** `protect`, `admin`
    -   Triggers the diagnostic process and returns the full report object.

-   **Get Diagnostic History:**
    -   `GET /api/mikrotik/users/:userId/diagnostics`
    -   **Middleware:** `protect`, `admin`
    -   Retrieves a list of all saved diagnostic reports for the specified user.

### 3.2. Module System

-   **Note:** All new backend files (`diagnosticController.js`, `diagnosticRoutes.js`, `DiagnosticLog.js`) use the **CommonJS** module system (`require`/`module.exports`) to maintain consistency with the existing backend codebase and avoid module resolution conflicts.

### 3.3. Data Model (`DiagnosticLog`)

A new collection, `diagnosticLogs`, stores the results of each run.

```javascript
// backend/models/DiagnosticLog.js
const mongoose = require('mongoose');

const diagnosticStepSchema = new mongoose.Schema({
  stepName: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failure', 'Warning', 'Skipped', 'In-Progress'], required: true },
  summary: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed }
});

const diagnosticLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikUser', required: true },
  router: { type: mongoose.Schema.Types.ObjectId, ref: 'MikrotikRouter' },
  cpeDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  finalConclusion: { type: String, required: true },
  steps: [diagnosticStepSchema],
}, { timestamps: true });

const DiagnosticLog = mongoose.model('DiagnosticLog', diagnosticLogSchema);
module.exports = DiagnosticLog;
```

### 3.4. Controller (`diagnosticController.js`)

The controller contains helper functions that adapt logic from the existing monitoring services to perform on-demand checks for a single router, user, or CPE. The main `runDiagnostic` function executes the following sequence:

1.  **Billing Check**
2.  **Mikrotik Router Check**
3.  **Client Status Check**
4.  **CPE (Station) Check**
5.  **Neighbor Analysis**

It builds a `DiagnosticLog` object throughout this process and saves it to the database before returning it in the response.