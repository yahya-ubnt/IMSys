# Dockerization Specification for SaaS Deployment

This document outlines the strategy for containerizing the ISP Management System using Docker for a SaaS (Software as a Service) deployment model.

## 1. Overview

Our goal is to create a portable, scalable, and consistent environment for the entire application stack. We use Docker to containerize individual services and Docker Compose to manage the multi-container application. This setup is optimized for both development and production workflows.

This setup consists of:
- A **backend** service running the Node.js API.
- A **frontend** service running the Next.js web application.
- A **database** service (MongoDB).

## 2. File Structure

```
isp-management-system/
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── docker-compose.prod.yml
└── ...
```

## 3. Backend Dockerfile

**File:** `backend/Dockerfile`

This multi-stage Dockerfile creates a lean production image by separating the build environment from the runtime environment.

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 5000
CMD [ "node", "server.js" ]
```

## 4. Frontend Dockerfile

**File:** `frontend/Dockerfile`

This multi-stage Dockerfile builds the Next.js application and creates a minimal production image containing only the necessary assets.

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 3000
CMD [ "npm", "start" ]
```

## 5. Docker Compose for Development

**File:** `docker-compose.yml`

This file is optimized for development, enabling features like hot-reloading.

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: builder
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/isp_management
    volumes:
      - ./backend:/usr/src/app
    depends_on:
      - mongo

  frontend:
    build:
      context: ./frontend
      target: builder
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/usr/src/app
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27018:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## 6. Docker Compose for Production

**File:** `docker-compose.prod.yml`

This file is tailored for production, building and running the lean, optimized production images.

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: production
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/isp_management
    depends_on:
      - mongo

  frontend:
    build:
      context: ./frontend
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27018:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## 7. Usage

### Development
To start the development environment with hot-reloading:
```bash
docker-compose up --build
```

### Production
To build and run the optimized production images:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

To stop the services for either environment:
```bash
docker-compose down
# or for production
docker-compose -f docker-compose.prod.yml down
```

## 8. SaaS Use Cases & Benefits

This improved Docker setup provides key advantages for a SaaS application:
*   **Consistent Environments:** Eliminates the "it works on my machine" problem.
*   **Simplified Onboarding:** New developers can get started quickly.
*   **Deployment Parity:** Reduces risks by deploying the same images that were tested locally.
*   **Scalability:** Foundation for scaling services independently.
*   **Isolation & Security:** Services run in isolated containers with non-root users.
*   **Portability:** Prevents vendor lock-in by being cloud-agnostic.
*   **Efficiency:** Multi-stage builds create smaller images, saving registry space and speeding up deployments.