# Deployment and Rollback Procedure Plan

## 1. Introduction

This document outlines a standardized procedure for deploying updates to the IMSys application and for performing rapid rollbacks in case of issues. A well-defined deployment and rollback strategy is crucial for minimizing downtime, ensuring application stability, and maintaining user trust in a production environment.

## 2. Key Principles

-   **Immutability:** Docker images, once built, are never changed. New code means a new image with a new tag.
-   **Versioning:** Every deployment uses specific, unique image tags (e.g., `backend:v1.2.3`) rather than mutable tags like `latest`.
-   **Atomic Deployments:** Deployments should be treated as a single, indivisible operation. Either the new version is fully up and running, or the old version remains.
-   **Fast Rollbacks:** The ability to revert to a previous stable version quickly and reliably is paramount.

## 3. Pre-Deployment Checklist

Before initiating any deployment to production, ensure the following:

-   **Code Review & Testing:** All code changes have been thoroughly reviewed and passed all automated and manual tests in a staging environment.
-   **Database Backups:** A fresh, verified database backup has been taken and, ideally, synchronized off-site. This is critical for recovery in case of a failed database migration.
-   **Image Builds:** New Docker images for changed services have been successfully built and tagged with unique version numbers (e.g., `imsys-backend:v1.2.4`).
-   **Environment Variables/Secrets:** Any new environment variables or Docker secrets required by the new version are correctly configured on the production host.
-   **Rollback Plan:** The image tags for the *previous* stable version are known and readily available for a quick rollback.

## 4. Deployment Steps

This procedure assumes the application is managed via `docker-compose.prod.yml` on a single VPS.

### Step 1: Update `docker-compose.prod.yml`

-   **Action:** SSH into the production VPS.
-   **Action:** Navigate to the project root directory.
-   **Action:** Edit `docker-compose.prod.yml` to update the `image` tags for any services that have new versions.
    ```yaml
    # Example change for backend service
    services:
      backend:
        image: your-repo/imsys-backend:v1.2.4 # Update this tag
        # ... other configurations
    ```
    *(Note: If you are building images directly on the server, you would update the `build` section and ensure the `image` tag is correctly set in the Dockerfile or build arguments.)*

### Step 2: Deploy New Services

-   **Action:** Run the Docker Compose command to apply the changes:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --force-recreate
    ```
    -   `up -d`: Starts containers in detached mode.
    -   `--force-recreate`: Ensures that containers are stopped and recreated, picking up the new image tags and any other configuration changes. This is crucial for applying updates.

### Step 3: Verify Deployment

-   **Action:** After the command completes, immediately verify the application's health:
    -   Check container statuses: `docker ps` (ensure all services are `(healthy)`).
    -   Check application logs: `docker logs <service_name>` (look for startup errors).
    -   Perform basic functional tests (e.g., access the frontend, log in, check key features).

## 5. Rollback Steps

If any issues are detected during or after deployment, initiate a rollback immediately.

### Step 1: Identify Previous Stable Version

-   **Action:** Determine the image tags of the last known stable version of the application. This should be part of your versioning strategy.

### Step 2: Revert `docker-compose.prod.yml`

-   **Action:** Edit `docker-compose.prod.yml` to revert the `image` tags back to the previous stable versions.
    ```yaml
    # Example rollback for backend service
    services:
      backend:
        image: your-repo/imsys-backend:v1.2.3 # Revert to previous stable tag
        # ... other configurations
    ```

### Step 3: Deploy Previous Services

-   **Action:** Run the Docker Compose command to revert to the previous version:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --force-recreate
    ```

### Step 4: Verify Rollback

-   **Action:** Confirm that the application is now running the previous stable version and that all services are `(healthy)`.
-   **Action:** Investigate the root cause of the failed deployment in a non-production environment.

## 6. Database Migrations and Rollback Considerations

-   **Challenge:** Database schema changes (migrations) are the most complex aspect of rollbacks.
-   **Strategy:**
    -   **Backward Compatibility:** Design database migrations to be backward-compatible whenever possible (i.e., the old version of the application can still run with the new schema).
    -   **Atomic Migrations:** Ensure migrations are atomic and can be reversed.
    -   **Manual Intervention:** In complex cases, a database rollback might require restoring from a backup taken *before* the migration, which is why pre-deployment backups are critical.
    -   **Never Rollback Data:** Avoid rolling back data changes; only schema changes. Data loss is unacceptable.
