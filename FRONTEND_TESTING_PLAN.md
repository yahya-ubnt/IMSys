# Frontend E2E Testing Plan

This document tracks the End-to-End (E2E) verification of the IMSys Frontend. Our goal is to ensure every page is functional, correctly connected to the backend, and provides a smooth user experience.

## Testing Strategy
We use **Playwright** to simulate real user interactions in a headless browser. Each test verifies:
1.  **Accessibility:** Can the page be reached?
2.  **Data Loading:** Does it fetch and display data from the backend?
3.  **Interactivity:** Do forms, buttons, and filters work?

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

### Phase 2: User & Network Management
- [x] **Mikrotik Users** (Verified: Full creation flow and list update)
- [x] **Mikrotik Routers** (List, Add Router)
- [x] **Packages** (List, Create, Update)
- [ ] **Devices/Antennas** (List, Create, Ping test)

### Phase 3: Financial Operations
- [ ] **Bills Page** (Create monthly bill, Mark as paid)
- [ ] **Invoices Page** (View invoice, Download PDF)
- [ ] **Transactions Page** (Search and Filter logs)
- [ ] **Payments/STK Push** (Trigger push, verify status)
- [ ] **Hotspot Vouchers** (Generate batch, View active)

### Phase 4: CRM & Support
- [ ] **Leads Page** (Add lead, Convert to user)
- [ ] **Tickets Page** (Open ticket, Add note, Resolve)
- [ ] **Technician Activities** (Log installation/support)

### Phase 5: System & Reporting
- [ ] **Reports Page** (Generate Revenue/M-Pesa reports)
- [ ] **General Settings** (Update App Name/Logo)
- [ ] **M-Pesa Settings** (Update credentials)
- [ ] **Notifications** (Mark as read, Delete)

---

## Progress Summary
- **Verified Pages:** 0
- **Broken/Issues:** 0
- **Total Coverage:** 0%
