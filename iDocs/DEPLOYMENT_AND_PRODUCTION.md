# Deployment and Production Guide

This document outlines the steps taken to set up a local production-like environment using Docker Compose on a Debian PC without a domain, and details the changes required for deployment to a VPS with a domain.

## 1. Local Production-like Setup (Debian PC, No Domain)

This setup allows you to test your application in a production-like Docker environment on your local machine.

### Key Files:
*   `docker-compose.prod.yml`: Defines the services (backend, worker, frontend, mongo, redis, nginx) and their configurations.
*   `nginx/nginx.local.conf`: Nginx configuration tailored for local HTTP access.
*   `.env.production`: Environment variables for production, kept separate from version control.
*   `backend/Dockerfile`: Multi-stage Dockerfile for the backend service.
*   `frontend/Dockerfile`: Multi-stage Dockerfile for the frontend service.
*   `backend/config/env.js`: Configures the backend to load environment variables.
*   `frontend/src/lib/api.ts` & `frontend/src/services/socketService.js`: Frontend API and Socket.IO client configurations.

### Setup Steps:

1.  **Ensure `.env.production` is configured:**
    *   Create a file named `.env.production` in your project root (`/home/mtk/IMSys/.env.production`).
    *   Fill it with your production environment variables. For local testing, ensure `NEXT_PUBLIC_API_URL=http://localhost/api` and `ENCRYPTION_KEY` is a valid 64-character hex string.
    *   Example content for `.env.production`:
        ```
        NODE_ENV=production
        PORT=5000
        MONGO_URI=mongodb://mongo:27017/imsys-mongo
        JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET_HERE
        JWT_EXPIRE=30d
        ENCRYPTION_KEY=7cfc7ecfa0edc55734675f8b6a5a1863bc8cd8f9bf64b42737a0cd69e685b2a5
        REDIS_URI=redis://redis:6379
        NEXT_PUBLIC_API_URL=http://localhost/api
        ```
        *(Remember to replace `YOUR_PRODUCTION_JWT_SECRET_HERE` with a strong, unique secret.)*

2.  **Backend `Dockerfile` (`backend/Dockerfile`):**
    *   Ensure `NEXT_PUBLIC_` environment variables are passed as build arguments.
    ```dockerfile
    # Stage 1: Builder
    FROM node:18-alpine AS builder
    WORKDIR /usr/src/app
    ARG NEXT_PUBLIC_API_URL
    ARG NEXT_PUBLIC_API_BASE_URL_CLIENT
    ARG NEXT_PUBLIC_API_BASE_URL_SERVER
    ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
    ENV NEXT_PUBLIC_API_BASE_URL_CLIENT=$NEXT_PUBLIC_API_BASE_URL_CLIENT
    ENV NEXT_PUBLIC_API_BASE_URL_SERVER=$NEXT_PUBLIC_API_BASE_URL_SERVER
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build
    # ... rest of the Dockerfile
    ```

3.  **Backend Environment Loading (`backend/config/env.js`):**
    *   Ensure this file explicitly loads `.env.production` if `NODE_ENV` is production.
    ```javascript
    const path = require('path');
    const dotenv = require('dotenv');

    if (process.env.NODE_ENV === 'production') {
      dotenv.config({ path: '/usr/src/app/.env.production' });
    } else {
      dotenv.config();
    }
    // ... rest of the file
    ```

4.  **Frontend API Configuration (`frontend/src/lib/api.ts`):**
    *   Ensure no hardcoded fallbacks for `API_BASE_URL`.
    ```typescript
    const API_BASE_URL = IS_SERVER ? process.env.NEXT_PUBLIC_API_BASE_URL_SERVER : process.env.NEXT_PUBLIC_API_BASE_URL_CLIENT;
    ```

5.  **Frontend Socket.IO Configuration (`frontend/src/services/socketService.js`):**
    *   Ensure no hardcoded fallbacks for `socketUrl`.
    ```javascript
    const socketUrl = (process.env.NEXT_PUBLIC_API_URL).replace('/api', '');
    ```

6.  **`docker-compose.prod.yml` Configuration:**
    *   **Backend & Worker Services:**
        *   Use `env_file: - ./.env.production` to load environment variables.
        *   Mount `.env.production` as a read-only volume: `- ./.env.production:/usr/src/app/.env.production:ro`.
    *   **Frontend Service:**
        *   Pass `NEXT_PUBLIC_` variables as `build.args`.
        *   Example `frontend` service snippet:
            ```yaml
              frontend:
                build:
                  context: ./frontend
                  target: production
                  args:
                    NEXT_PUBLIC_API_URL: http://localhost/api
                    NEXT_PUBLIC_API_BASE_URL_CLIENT: http://localhost/api
                    NEXT_PUBLIC_API_BASE_URL_SERVER: http://backend:5000/api
                restart: unless-stopped
            ```
    *   **Nginx Service:**
        *   Mount `nginx/nginx.local.conf` for local testing: `- ./nginx/nginx.local.conf:/etc/nginx/nginx.conf:ro`.

7.  **Run the Application:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build --force-recreate
    ```
    (Use `--force-recreate` for specific services like `frontend` if you only changed its code, e.g., `docker compose -f docker-compose.prod.yml up -d --build --force-recreate frontend`).

8.  **Access:** Open your browser to `http://localhost`.

## 2. Deploying to a VPS (with Domain and SSL)

When moving to a production VPS with a domain and SSL, you need to make the following changes:

1.  **Update `nginx/nginx.conf`:**
    *   Replace `your_domain.com` with your actual domain name.
    *   **Configure SSL Certificates:** Uncomment and update the `ssl_certificate` and `ssl_certificate_key` lines with the paths to your SSL certificate files (e.g., obtained from Let's Encrypt).
    *   Example `nginx.conf` snippet:
        ```nginx
        server {
            listen 80;
            server_name your_domain.com;
            location / {
                return 301 https://$host$request_uri;
            }
        }
        server {
            listen 443 ssl;
            server_name your_domain.com;
            ssl_certificate /etc/nginx/certs/fullchain.pem; # Update path
            ssl_certificate_key /etc/nginx/certs/privkey.pem; # Update path
            # ... rest of Nginx config
        }
        ```

2.  **Update `.env.production`:**
    *   On your VPS, ensure the `.env.production` file contains your actual production secrets and credentials.
    *   Update `NEXT_PUBLIC_API_URL` to use your domain with HTTPS: `NEXT_PUBLIC_API_URL=https://your_domain.com/api`.
    *   Update `MPESA_CALLBACK_URL` to use your domain with HTTPS: `MPESA_CALLBACK_URL=https://your_domain.com/api/payments/mpesa/callback`.
    *   *(Remember: This file should **never** be committed to version control.)*

3.  **Update `docker-compose.prod.yml`:**
    *   Change the Nginx volume mount from `nginx/nginx.local.conf` to `nginx/nginx.conf`:
        ```yaml
          nginx:
            # ...
            volumes:
              - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
              # - /path/to/your/certs:/etc/nginx/certs:ro # Uncomment and update for SSL certs
            # ...
        ```
    *   Update the `build.args` for the `frontend` service to reflect the production domain:
        ```yaml
          frontend:
            build:
              # ...
              args:
                NEXT_PUBLIC_API_URL: https://your_domain.com/api
                NEXT_PUBLIC_API_BASE_URL_CLIENT: https://your_domain.com/api
                NEXT_PUBLIC_API_BASE_URL_SERVER: http://backend:5000/api # Internal Docker network
            # ...
        ```

4.  **Deploy on VPS:**
    *   Copy all necessary project files (excluding `.env.production` from Git, but ensure it's on the VPS).
    *   Execute the Docker Compose command on your VPS:
        ```bash
        docker compose -f docker-compose.prod.yml up -d --build --force-recreate
        ```

This document summarizes the entire process for both local testing and production deployment.
