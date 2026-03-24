# Off-Site Backup Synchronization Plan

## 1. Introduction

This document details the implementation plan for setting up automated off-site backup synchronization for the IMSys application. This is a critical step to ensure data safety and enable disaster recovery in the event of a total server failure. This plan complements the existing local backup system by providing a geographically separate, secure copy of our database backups.

## 2. Core Components

Implementing off-site backups involves three main components:

### 2.1. Remote Storage (The "Vault")

- **Purpose:** A secure, reliable, and cost-effective location to store backup files outside of the primary VPS.
- **Recommendation:** Object storage services are ideal for this purpose due to their scalability, durability, and low cost.
- **Examples:**
    - **Amazon S3:** Industry standard, highly scalable, feature-rich.
    - **Backblaze B2:** Often more cost-effective, simple to use.
    - **Google Cloud Storage:** Google's equivalent object storage.
- **Action Required (User):**
    1.  Choose a cloud storage provider.
    2.  Create an account.
    3.  Create a dedicated "bucket" (e.g., `imsys-prod-backups`) for storing backups.
    4.  Generate API credentials (an **Access Key ID** and a **Secret Access Key**) that grant programmatic access to this specific bucket. These keys must be kept highly secure.

### 2.2. The Sync Tool (The "Armored Car")

- **Purpose:** A robust command-line utility on the VPS that can securely transfer files to and from various cloud storage providers.
- **Recommendation:** `rclone` (Remote Clone)
    - `rclone` is a powerful, open-source, multi-cloud sync tool.
    - It supports over 70 cloud storage products, including S3, B2, Google Drive, etc.
    - It handles encryption, integrity checks, and efficient syncing (only transferring new or changed parts of files).
- **Action Required (Agent/Admin):**
    1.  Install `rclone` on the host VPS.
    2.  Configure `rclone` with the API credentials obtained in Step 2.1. This involves an interactive setup process (`rclone config`) that stores encrypted credentials in a configuration file (e.g., `~/.config/rclone/rclone.conf`).

### 2.3. Automation (The "Schedule")

- **Purpose:** To ensure the off-site synchronization runs automatically and reliably after the local database backup has completed.
- **Recommendation:** Host-level `cron` job
    - `cron` is a standard Linux utility for scheduling commands to run at fixed times or intervals.
- **Action Required (Agent/Admin):**
    1.  Create a small shell script (e.g., `scripts/sync-backups.sh`) that contains the `rclone sync` command.
    2.  Add an entry to the system's crontab to execute `scripts/sync-backups.sh` daily, typically an hour or two after the local database backup is scheduled to run (e.g., 3:00 AM if local backup is 2:00 AM).

## 3. Detailed Implementation Steps

### Step 1: User - Choose Provider & Obtain API Keys

-   **Action:** Select a cloud storage provider (e.g., Backblaze B2 for cost-effectiveness, Amazon S3 for features).
-   **Action:** Create a dedicated bucket for IMSys production backups.
-   **Action:** Generate an Access Key ID and Secret Access Key for programmatic access to this bucket.
-   **Security Note:** Treat these API keys as highly sensitive secrets. They should not be committed to version control.

### Step 2: Agent/Admin - Install and Configure `rclone`

-   **Action:** SSH into the VPS.
-   **Action:** Install `rclone` (e.g., `sudo apt install rclone` on Debian/Ubuntu).
-   **Action:** Run `rclone config` and follow the interactive prompts to set up a new remote.
    -   Choose the appropriate storage type (e.g., `s3` for Amazon S3, `b2` for Backblaze B2).
    -   Enter the Access Key ID and Secret Access Key when prompted.
    -   Name the remote (e.g., `imsys-b2-remote` or `imsys-s3-remote`).

### Step 3: Agent/Admin - Create Sync Script and Cron Job

-   **Action:** Create a new shell script, e.g., `scripts/sync-backups.sh`, with content similar to:
    ```bash
    #!/bin/bash
    # Sync local backups to off-site storage
    LOG_FILE="/var/log/rclone_sync.log"
    BACKUP_DIR="/home/mtk/IMSys/backups" # Adjust if IMSys root is different
    RCLONE_REMOTE="imsys-b2-remote" # Name configured in rclone config
    RCLONE_BUCKET="imsys-prod-backups" # Name of your bucket

    echo "Starting rclone sync at $(date)" >> "$LOG_FILE"
    /usr/bin/rclone sync "$BACKUP_DIR" "$RCLONE_REMOTE:$RCLONE_BUCKET" --log-file="$LOG_FILE" --log-level INFO --backup-dir "$RCLONE_REMOTE:$RCLONE_BUCKET/archive/$(date +%Y-%m-%d)" --delete-excluded --exclude "**/tmp/**"
    echo "Finished rclone sync at $(date)" >> "$LOG_FILE"
    ```
    *(Note: The `--backup-dir` flag is excellent for keeping old versions of files in the cloud, providing versioning.)*
-   **Action:** Make the script executable: `chmod +x scripts/sync-backups.sh`.
-   **Action:** Add a cron job entry (e.g., `crontab -e`) to run this script daily:
    ```
    0 3 * * * /home/mtk/IMSys/scripts/sync-backups.sh > /dev/null 2>&1
    ```
    *(This example runs at 3:00 AM daily, assuming local backup is 2:00 AM. Adjust paths as necessary.)*

## 4. Verification

-   **Action:** After the first scheduled run, verify that files appear in your cloud storage bucket.
-   **Action:** Periodically check the `rclone_sync.log` file for successful completion and any errors.
-   **Action:** Perform a test restore from the off-site backup to ensure data integrity and recovery process.
