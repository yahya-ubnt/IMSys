# Spec: Application-Managed Master Scheduler

## 1. Objective

To create a robust, database-driven system for managing scheduled tasks (cron jobs) directly from the application's frontend. This will provide administrators with a user-friendly interface to view, control, and monitor all automated tasks without needing command-line access to the server, enhancing security and usability.

## 2. System Architecture

The system will consist of three main components:
1.  **A Database Model (`ScheduledTask`):** To store the definition and status of each task.
2.  **A Master Scheduler Script:** A single, intelligent script that runs every minute and executes tasks based on the schedule defined in the database.
3.  **A Frontend UI:** A new page in the application for administrators to manage these tasks.

## 3. Functional Requirements

### 3.1. Backend - Database Model

A new Mongoose model named `ScheduledTask` will be created with the following schema:

-   `name` (String, required, unique): A user-friendly name for the task (e.g., "Automated Monthly Billing").
-   `description` (String): A brief explanation of what the task does.
-   `scriptPath` (String, required): The absolute path to the Node.js script file to be executed.
-   `schedule` (String, required): The cron schedule string (e.g., "5 0 * * *").
-   `isEnabled` (Boolean, default: `true`): A flag to easily enable or disable the task.
-   `lastRun` (Date): The timestamp of the last time the task was executed.
-   `lastStatus` (String, enum: `['Success', 'Failed', 'Pending']`): The result of the last run.
-   `logOutput` (String): The console output or error message from the last run.

### 3.2. Backend - Master Scheduler Script

-   **File:** `backend/scripts/masterScheduler.js`
-   **Execution:** This script will be triggered by a single cron job on the server, configured to run **every minute (`* * * * *`)**.
-   **Logic:**
    1.  Connect to the database.
    2.  Fetch all `ScheduledTask` documents where `isEnabled` is `true`.
    3.  For each task, use a cron parsing library to check if its `schedule` matches the current server time.
    4.  If a task is due, execute the script at `scriptPath` as a child process.
    5.  Capture all `stdout` and `stderr` from the child process.
    6.  Update the task's document in the database with the `lastRun` timestamp, the `lastStatus` ('Success' or 'Failed'), and the captured `logOutput`.

### 3.3. Backend - API Endpoints

New endpoints will be created to allow the frontend to manage the tasks:

-   `GET /api/scheduled-tasks`: Fetches all scheduled tasks.
-   `PUT /api/scheduled-tasks/:id`: Updates a task (e.g., to change the schedule or enable/disable it).
-   `POST /api/scheduled-tasks`: Creates a new scheduled task.
-   `DELETE /api/scheduled-tasks/:id`: Deletes a task.
-   `POST /api/scheduled-tasks/:id/run`: Manually triggers a task to run immediately for testing purposes.

### 3.4. Frontend - UI/UX

-   **Location:** A new page will be created at `/admin/scheduled-tasks` (or a similar admin-level route).
-   **Main View:** A data table displaying all scheduled tasks with the following columns:
    -   **Status:** An On/Off toggle switch representing the `isEnabled` flag.
    -   **Task Name:** The `name` of the task.
    -   **Schedule:** A human-readable version of the `schedule` string (e.g., "Every day at 12:05 AM").
    -   **Last Run:** The `lastRun` timestamp.
    -   **Last Status:** A "Success" or "Failed" badge.
    -   **Actions:** A dropdown menu with "Edit," "Run Now," "View Logs," and "Delete."
-   **Forms:**
    -   A form (modal or new page) for creating and editing tasks, with fields for name, description, script path, and schedule.
    -   A modal to display the `logOutput` for a specific task run.

## 4. Implementation Plan

1.  **Remove Existing Cron Jobs:** The first step will be to remove the individual cron jobs we created for billing, disconnections, and reminders.
2.  **Create the `ScheduledTask` Model:** Implement the Mongoose schema as defined above.
3.  **Create the Master Scheduler Script:** Write the `masterScheduler.js` script with the logic to check schedules and execute child processes.
4.  **Set Up the Master Cron Job:** Add the single cron job to the server's crontab to run the master scheduler every minute.
5.  **Seed Initial Tasks:** Create a seeder script to populate the `ScheduledTask` collection with the tasks we have already created (Billing, Disconnections, Reminders, Cleanup).
6.  **Build the Backend API:** Create the new routes and controller functions for managing the tasks.
7.  **Build the Frontend UI:** Develop the React components for the "Scheduled Tasks" dashboard page.

This approach will provide a secure, flexible, and user-friendly system for managing all automated tasks within the application.
