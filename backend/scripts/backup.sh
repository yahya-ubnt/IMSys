#!/bin/bash
set -e

# --- Configuration ---
BACKUP_DIR="/home/mtk/IMSys/backups"
CONTAINER_NAME="imsys-mongo-prod"
DB_NAME="imsys-mongo" # The name of the database to back up

# --- Create Backup ---
echo "Starting database backup for ${DB_NAME}..."

# Create a timestamped filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="${DB_NAME}_${TIMESTAMP}.gz"
BACKUP_PATH="${BACKUP_DIR}/${FILENAME}"

# Execute mongodump inside the container
docker exec "${CONTAINER_NAME}" mongodump --db="${DB_NAME}" --archive --gzip > "${BACKUP_PATH}"

echo "Database backup completed successfully!"
echo "Backup file: ${BACKUP_PATH}"
