# Frontend E2E Testing Plan

This document tracks the End-to-End (E2E) verification of the IMSys Frontend. Our goal is to ensure every page is functional, correctly connected to the backend, and provides a smooth user experience.

## Testing Strategy
We use **Playwright** to simulate real user interactions in a headless browser. Each test verifies:
1.  **Accessibility:** Can the page be reached?
2.  **Data Loading:** Does it fetch and display data from the backend?
3.  **Interactivity:** Do forms, buttons, and filters work?

---

## E2E Checklist

### Phase 1: Authentication & Core
- [ ] **Login Page** (Valid/Invalid credentials)
- [ ] **Registration Page** (New tenant onboarding)
- [ ] **Main Dashboard** (Verify stats cards and charts load)

### Phase 2: User & Network Management
- [ ] **Mikrotik Users** (List, Create, Update, Delete)
- [ ] **Mikrotik Routers** (List, Add Router, Test Connection)
- [ ] **Packages** (List, Create, Update)
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
