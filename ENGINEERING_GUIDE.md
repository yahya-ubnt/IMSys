# IMSys Engineering Guide & Roadmap

This document outlines our engineering standards, infrastructure architecture, and deployment strategy. It serves as the "source of truth" for the team.

## 1. Collaboration Workflow: "Speed with Safety"

We are moving from solo coding to a team workflow. The goal is to move fast without breaking production.

### The Golden Rule
**NEVER push directly to the `main` branch.**

### The Process
1.  **Pick a Task:** "I'm working on the M-Pesa integration."
2.  **Branch Out:**
    ```bash
    git checkout -b feature/mpesa-integration
    ```
3.  **Code & Commit:**
    *   Keep commits small and descriptive.
    *   Run local checks before committing.
4.  **Push & PR:**
    ```bash
    git push origin feature/mpesa-integration
    ```
    *   Go to GitHub/GitLab and open a **Pull Request (PR)** to `main`.
5.  **The Check (CI):**
    *   GitHub Actions will automatically run. If it fails (tests/lint), you cannot merge.
6.  **Merge:**
    *   Review the code (even your own).
    *   Squash and Merge.
    *   *This triggers the deployment to production.*

---

## 2. Infrastructure: The "Box" (Docker Compose)

We are running everything on a single VPS using Docker Compose. This makes our infrastructure portable and easy to restore.

### The Stack (Services)

1.  **Reverse Proxy (The Doorman)**
    *   **Service:** `nginx-proxy-manager`
    *   **Why:** Nginx configuration via terminal is painful. This provides a beautiful **Web UI** at port `81`.
    *   **Job:** Handles SSL (Let's Encrypt), routes `imsys.com` to Frontend, `api.imsys.com` to Backend.

2.  **The App**
    *   **`frontend`**: Next.js (Port 3000 - internal only)
    *   **`backend`**: Node.js/Express (Port 5000 - internal only)
    *   **`mongo`**: Database (Port 27017 - internal only)

3.  **The Connectivity Layer (VPNs)**
    *   **`wg-easy` (WireGuard)**:
        *   Modern, fast VPN.
        *   Includes a **Web UI** (Port 51821) to generate client configs (QR codes) for Mikrotiks.
    *   **`openvpn`**:
        *   Legacy support for older routers.
        *   Solid, reliable backup.

### Production Docker Compose (`docker-compose.prod.yml`)

We will update our compose file to include these services.

```yaml
services:
  # --- The App ---
  backend:
    build:
      context: ./backend
      target: production
    # No ports exposed publicly! The Proxy handles it.
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/isp_management
    depends_on:
      - mongo
    networks:
      - app_network

  frontend:
    build:
      context: ./frontend
      target: production
    # No ports exposed publicly!
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - app_network

  mongo:
    image: mongo:latest
    volumes:
      - ./data/mongo:/data/db # Persist data on host
    networks:
      - app_network

  # --- The Doorman (Proxy) ---
  proxy:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'   # HTTP
      - '443:443' # HTTPS
      - '81:81'   # Admin Web UI
    volumes:
      - ./data/npm:/data
      - ./data/letsencrypt:/etc/letsencrypt
    networks:
      - app_network

  # --- The Connectivity (VPNs) ---
  wireguard:
    image: ghcr.io/wg-easy/wg-easy
    container_name: wg-easy
    volumes:
      - ./data/wireguard:/etc/wireguard
    environment:
      - WG_HOST=YOUR_SERVER_IP # ⚠️ CHANGE THIS
      - PASSWORD=YOUR_ADMIN_PASS # ⚠️ CHANGE THIS
    ports:
      - "51820:51820/udp" # VPN Traffic
      - "51821:51821/tcp" # Web UI
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
    networks:
      - app_network

  openvpn:
    image: kylemanna/openvpn
    volumes:
      - ./data/openvpn:/etc/openvpn
    ports:
      - "1194:1194/udp"
    cap_add:
      - NET_ADMIN
    networks:
      - app_network

networks:
  app_network:
    driver: bridge
```

---

## 3. Network Architecture: "Call Home"

This is how we control routers behind NATs (without needing static IPs at client sites).

1.  **The Tunnel:**
    *   We create a persistent VPN tunnel.
    *   **Mikrotik (Client)** initiates connection -> **VPS (Server)**.
    *   This punches through the client's firewall.
2.  **Addressing:**
    *   WireGuard assigns internal IPs (e.g., `10.8.0.x`).
    *   VPS is always `10.8.0.1`.
    *   Client Router A is `10.8.0.2`.
3.  **Command Execution:**
    *   Backend says: "Disconnect User X".
    *   Code executes: `ssh admin@10.8.0.2 "/interface pppoe-server remove [find user=X]"`
    *   Traffic flows securely over the VPN tunnel.

---

## 4. CI/CD Pipeline: The "Automator"

We will use **GitHub Actions**.

**File:** `.github/workflows/deploy.yml`

**What it does:**
1.  **Test:** Runs on every Push.
    *   `npm run lint`
    *   `npm test` (Playwright)
2.  **Build:** Runs on merge to `main`.
    *   Builds Docker images for Frontend and Backend.
    *   Pushes them to GitHub Container Registry (GHCR).
3.  **Deploy:**
    *   Logs into VPS via SSH.
    *   Runs: `docker-compose pull && docker-compose up -d`.

---

## 5. Testing Strategy: The "Critical Path"

We cannot test manually forever. We need **Automated End-to-End (E2E) Tests** that focus on the parts of the app that generate revenue and provide service.

**Tool:** Playwright (Robot user that clicks through the real UI).

### The "Must-Have" Core Service Tests

1.  **The "Sales Funnel" Test (Leads to Clients)**
    *   **Goal:** Ensure we can capture new business.
    *   **Workflow:** Register a new Lead -> Open Lead Profile -> Click "Convert to User" -> Fill Mikrotik User form -> Submit.
    *   **Success:** Lead is deleted/moved, and a new Mikrotik User record is created.

2.  **The "Provisioning" Test (Mikrotik Integration)**
    *   **Goal:** Ensure the backend can actually talk to the routers.
    *   **Workflow:** Create a new PPPoE User -> Click Save.
    *   **Success:** Backend receives the request, and (in test mode) we verify the API call was sent to the Mikrotik router.

3.  **The "Enforcement" Test (Cutting & Restoring Service)**
    *   **Goal:** Ensure we can manage client access.
    *   **Workflow:** Search for an active User -> Click "Disconnect" -> Confirm -> Verify Status is "Suspended" -> Click "Connect" -> Verify Status is "Active".
    *   **Success:** The UI reflects the state change, and the backend sends the corresponding `/ppp/secret/set disabled=yes/no` command.

4.  **The "Payment & Wallet" Test**
    *   **Goal:** Ensure billing is accurate.
    *   **Workflow:** Trigger a manual STK push request -> Log a dummy payment.
    *   **Success:** The User's wallet balance increases, and a Transaction log is generated.

If any of these 4 tests fail, the **deployment is cancelled**. This protects our core revenue and service reliability.

