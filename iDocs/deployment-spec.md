# Spec: Production Deployment Guide

## 1. Objective

To provide a comprehensive, step-by-step guide for deploying the ISP Management System to a new, clean Linux-based Virtual Private Server (VPS). This document is intended to be a complete checklist for a production-ready setup.

## 2. Server Requirements

-   **Operating System:** A modern Linux distribution (e.g., Ubuntu 22.04 LTS or later).
-   **Minimum Resources:** 1 CPU, 2GB RAM, 25GB Storage (recommended resources may be higher depending on user load and data volume).
-   **Firewall:** A configured firewall (like `ufw`) allowing traffic on ports 22 (SSH), 80 (HTTP), and 443 (HTTPS).

---

## 3. Deployment Checklist

### Step 3.1: Core System Tools (The Foundation)

These are the essential programs that must be installed on the server's operating system.

1.  **Node.js & npm:**
    -   **Purpose:** To run the backend API and frontend build process.
    -   **Action:** Install a modern LTS version of Node.js (e.g., v20.x). This is typically done by adding a new package source and then using `apt-get`.
    -   `sudo apt-get update`
    -   `sudo apt-get install -y nodejs npm`

2.  **MongoDB:**
    -   **Purpose:** The primary database for the application.
    -   **Action:** Install, enable, and secure the MongoDB server.
    -   Follow the official MongoDB installation guide for your Linux distribution.
    -   `sudo systemctl start mongod`
    -   `sudo systemctl enable mongod`

3.  **Git:**
    -   **Purpose:** To clone the project repository onto the server.
    -   **Action:** `sudo apt-get install -y git`

4.  **Nginx (Recommended):**
    -   **Purpose:** To act as a reverse proxy, manage HTTPS, and serve the frontend.
    -   **Action:** Install and enable Nginx.
    -   `sudo apt-get install -y nginx`
    -   `sudo systemctl start nginx`
    -   `sudo systemctl enable nginx`

### Step 3.2: Global Node.js Tools

This is a Node.js package that needs to be installed globally to be used as a command-line tool.

1.  **PM2 (Process Manager):**
    -   **Purpose:** To run the Node.js applications (API server and scheduler) as persistent background services.
    -   **Action:** `sudo npm install pm2 -g`

### Step 3.3: Project Setup

1.  **Clone the Repository:**
    -   **Action:** Clone your project code into a directory on the server (e.g., `/var/www/my-app`).
    -   `git clone <your_repository_url> /var/www/my-app`

2.  **Install Backend Dependencies:**
    -   **Action:** Navigate to the `backend` directory and install the required npm packages.
    -   `cd /var/www/my-app/backend`
    -   `npm install`

3.  **Install Frontend Dependencies:**
    -   **Action:** Navigate to the `frontend` directory and install the required npm packages.
    -   `cd /var/www/my-app/frontend`
    -   `npm install`

4.  **Create `.env` File:**
    -   **Action:** In the `backend` directory, create a `.env` file and populate it with your production database credentials, JWT secret, SMS provider keys, and any other necessary environment variables.

### Step 3.4: Build and Run the Application

1.  **Build the Frontend:**
    -   **Purpose:** To create a highly optimized, static version of the Next.js frontend.
    -   **Action:** In the `frontend` directory, run the build command.
    -   `cd /var/www/my-app/frontend`
    -   `npm run build`

2.  **Start Services with PM2:**
    -   **Purpose:** To launch the API server and the master scheduler as background services.
    -   **Action:** From the project's root directory (`/var/www/my-app`), run:
    -   `pm2 start backend/server.js --name "api-server"`
    -   `pm2 start backend/scripts/masterScheduler.js --name "master-scheduler"`

3.  **Configure PM2 to Start on Boot:**
    -   **Purpose:** To ensure your applications automatically restart if the server ever reboots.
    -   **Action:** `pm2 startup` (This will provide a command that you need to copy and run).
    -   `pm2 save`

### Step 3.5: Nginx Configuration (Reverse Proxy)

1.  **Create Nginx Config File:**
    -   **Action:** Create a new Nginx configuration file for your application (e.g., `/etc/nginx/sites-available/my-app`).
    -   This file will tell Nginx how to handle incoming traffic. It should:
        -   Listen on port 80 (and 443 for HTTPS).
        -   Define the server name (your domain).
        -   Forward all requests starting with `/api/` to your backend API server (running on `http://localhost:5000`).
        -   Serve the static frontend files from the `frontend/build` directory for all other requests.

2.  **Enable the Site and Test:**
    -   **Action:**
    -   `sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/`
    -   `sudo nginx -t` (to test for syntax errors).
    -   `sudo systemctl reload nginx`

3.  **Set Up HTTPS (Recommended):**
    -   **Action:** Use a tool like `certbot` to obtain and install a free SSL/TLS certificate from Let's Encrypt.
    -   `sudo apt-get install -y certbot python3-certbot-nginx`
    -   `sudo certbot --nginx -d yourdomain.com`
