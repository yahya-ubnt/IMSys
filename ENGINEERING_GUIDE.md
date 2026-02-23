# IMSys Engineering Master Plan & Roadmap

This document serves as the **Source of Truth** and **Implementation Roadmap** for the IMSys project. It bridges the gap between our current codebase and our production-ready target state.

## 1. Collaboration Workflow: "Speed with Safety"

Our goal is high-velocity delivery with zero production breakage.

### The Golden Rule
**NEVER push directly to the `main` branch.**

### The Workflow
1.  **Branch Strategy:**
    *   `main`: Production-ready code. Deploys automatically.
    *   `feature/xyz`: Development work.
    *   `hotfix/xyz`: Critical production fixes.
2.  **Process:**
    *   Create branch -> Code -> Local Test -> Push.
    *   Open Pull Request (PR) to `main`.
    *   **CI Checks (Target):** Automated Lint & Test must pass.
    *   Squash & Merge -> Triggers Deployment.

---

## 2. Infrastructure Architecture (Target State)

We are evolving our current `docker-compose.prod.yml` into a fully containerized "Box" that manages itself.

### The Stack (Target)
1.  **The App Core:**
    *   `frontend`: Next.js (Port 3000)
    *   `backend`: Node.js/Express (Port 5000)
    *   `mongo`: Database (Port 27017, Volume Persisted)
2.  **The Connectivity Layer (To Be Implemented):**
    *   `nginx-proxy-manager`: Handles SSL/Domains. Eliminates manual Nginx config.
    *   `wg-easy` (WireGuard): Manages VPN tunnels for Mikrotik communication.
    *   `openvpn`: Legacy backup.

### The "Onboarding Wizard" (Upcoming)
To simplify deployment for new ISPs, we will build an **Onboarding Wizard**.
*   **Concept:** A CLI or Web-based setup tool running on first launch.
*   **Responsibilities:**
    1.  **Environment Config:** prompts for `MONGO_URI`, `JWT_SECRET`, `MIKROTIK_IP`.
    2.  **Domain Setup:** Configures Nginx Proxy Manager automatically.
    3.  **Admin Creation:** Creates the first Super Admin user.
    4.  **Security:** Generates encryption keys and VPN credentials.

---

## 3. Network Architecture: "Call Home" Strategy

**Problem:** ISPs often have routers behind CGNAT (no public IP).
**Solution:** Reverse VPN Tunnels.

1.  **The Tunnel:** Mikrotik (Client) -> VPN (Server).
2.  **Addressing:** Fixed internal IPs (e.g., `10.8.0.x`) allow the Backend to command routers regardless of their public IP changes.
3.  **Command Execution:** Backend uses SSH over the VPN IP (`ssh admin@10.8.0.x`).

---

## 4. CI/CD Pipeline Specification (GitHub Actions)

We will implement the following pipelines in `.github/workflows/`.

### A. The "Gatekeeper" (Pull Requests)
**File:** `pr-check.yml`
*   **Trigger:** Open PR to `main`.
*   **Jobs:**
    1.  **Lint:** `npm run lint` (Frontend & Backend).
    2.  **Build Check:** `npm run build` (Ensures no compile errors).
    3.  **Unit Tests:** `npm test` (Logic verification).

### B. The "Shipper" (Production Deploy)
**File:** `deploy.yml`
*   **Trigger:** Push/Merge to `main`.
*   **Jobs:**
    1.  **Containerize:** Build Docker images for Frontend/Backend.
    2.  **Publish:** Push images to GitHub Container Registry (GHCR).
    3.  **Deploy:**
        *   SSH into VPS.
        *   `docker-compose pull`
        *   `docker-compose up -d`
        *   Run migrations (if any).

---

## 5. Testing Strategy & Implementation Plan

Current Status: **Pending Implementation**.
We need to install frameworks and write the "Critical Path" tests.

### Phase 1: The Foundation (Immediate Actions)
1.  **Backend:** Install `jest` and `supertest`.
    *   *Goal:* Test API endpoints (Auth, User Creation).
2.  **Frontend:** Install `playwright`.
    *   *Goal:* E2E browser testing.

### Phase 2: The "Money" Tests (Critical Path)
These 4 scenarios must pass for a release to be considered safe:

1.  **The Sales Funnel:** Lead -> Client conversion.
2.  **Provisioning:** Backend -> Mikrotik configuration success.
3.  **Enforcement:** Suspend/Unsuspend user triggers RouterOS command.
4.  **Billing:** Payment -> Wallet Credit -> Service Extension.

### Phase 3: "Nice-to-Haves"
*   Visual Regression Testing (Snapshot comparisons).
*   Load Testing (Simulating 1000 concurrent users).

---

## 6. Implementation Checklist (Next Steps)

- [ ] **Step 1:** Initialize Testing Frameworks (`npm install ...`).
- [ ] **Step 2:** Create `.github/workflows` directory and pipeline YAMLs.
- [ ] **Step 3:** Update `docker-compose.prod.yml` to include Nginx & Wireguard.
- [ ] **Step 4:** Write the "Sales Funnel" Playwright test.
