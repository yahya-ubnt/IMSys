# Worker and Web Server Separation Specification

## 1. Objective

This document clarifies the separation of concerns between the web server (`backend`) and the background worker (`worker`) processes. The goal is to ensure a stable, scalable, and maintainable architecture by assigning responsibilities to the correct process.

## 2. Architecture Overview

The application is designed to run as two distinct services, typically in separate Docker containers:

-   **`backend` service:** Runs the main web server (`server.js`). Its sole responsibility is to handle incoming API requests, process them, and send responses. It is the public-facing part of the application.

-   **`worker` service:** Runs the background job processor (`worker.js`). Its responsibilities include:
    -   Executing scheduled tasks (e.g., billing, reminders) via the `masterScheduler`.
    -   Processing asynchronous jobs from message queues (e.g., sending SMS, syncing with Mikrotik).
    -   Running one-time startup scripts.

## 3. "Before" - The Problem of Mixed Concerns

Previously, the `server.js` file was responsible for starting both the web server and all the background processes, including:
-   `masterScheduler`
-   `smsWorker`
-   `scheduledTaskWorker`
-   `startupDisconnect.js`

This created several critical issues:

-   **Instability:** The web server process was burdened with long-running background tasks, which could slow down API responses and affect user experience.
-   **Race Conditions:** Because the `docker-compose.prod.yml` also defines a separate `worker` service that starts its own set of workers, we had two instances of each worker running simultaneously. This created a "split-brain" scenario, leading to unpredictable behavior, duplicate job processing, and errors.
-   **Debugging Complexity:** It was difficult to trace logs and debug issues because the logs from background tasks were mixed with web server logs, and it was unclear which process was responsible for a particular job.

## 4. "After" - The Corrected Implementation

The corrected implementation enforces a strict separation of concerns:

-   **`server.js` (The Web Server):**
    -   Is now **only** responsible for starting the Express web server and handling API routes.
    -   All `require` statements for schedulers and workers have been **removed**.

-   **`worker.js` (The Background Worker):**
    -   Is now the **single source of truth** for all background processes.
    -   It is responsible for starting:
        -   All BullMQ workers (`scheduledTaskWorker`, `smsWorker`, `mikrotikSyncWorker`, etc.).
        -   The `masterScheduler` for cron-based jobs.
        -   Any startup scripts like `startupDisconnect.js`.

This corrected architecture ensures that:
-   The web server remains lightweight and responsive.
-   Background jobs are processed in an isolated and predictable environment.
-   The system is more scalable, as the `backend` and `worker` services can be scaled independently.
-   Debugging is simplified, as logs are clearly separated between the two services.

## 5. Inter-Process Communication for Scheduler Sync

### 5.1. The Challenge

A key challenge introduced by separating the `backend` and `worker` processes is keeping the `masterScheduler` (running in the `worker`) synchronized with changes made in the database by the `backend` process.

For example, when a user updates a scheduled task's schedule via the UI, the `backend` server handles the API request and updates the task in the database. However, the `worker` process, which is running the scheduler, is not automatically aware of this change. It only reads the task schedules from the database when it first starts.

### 5.2. The Solution: A Message Queue for System Events

To solve this, we will implement a robust communication channel using the existing BullMQ message queue infrastructure.

1.  **`System-Tasks` Queue:**
    -   A new, dedicated message queue named `System-Tasks` will be created. This queue will serve as a high-priority communication bus from the `backend` to the `worker` for internal system events.

2.  **`backend` as a Message Producer:**
    -   The `scheduledTaskController.js` (running in the `backend`) will be modified.
    -   Whenever a task is created, updated, or deleted, in addition to changing the database, it will also add a job to the `System-Tasks` queue.
    -   The job will contain a `name` (e.g., `task:created`, `task:updated`, `task:deleted`) and the relevant task data.

3.  **`masterScheduler` as a Message Consumer:**
    -   The `masterScheduler.js` (running in the `worker`) will be modified to listen for jobs on the `System-Tasks` queue.
    -   It will process these jobs and update its internal state accordingly:
        -   On a `task:created` job, it will schedule the new task.
        -   On a `task:updated` job, it will unschedule the old version and schedule the new version of the task.
        -   On a `task:deleted` job, it will unschedule the deleted task.

This event-driven approach ensures that the `masterScheduler` is always in sync with the latest task configurations in the database, without requiring manual intervention (like restarting the worker) or inefficient polling. It is a scalable and resilient solution that completes the architectural separation of the `backend` and `worker` services.