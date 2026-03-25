#!/bin/bash

echo "WARNING: This script will permanently delete ALL SMS logs from the database."
read -p "Are you sure you want to proceed? (yes/no): " CONFIRMATION

if [[ "$CONFIRMATION" != "yes" ]]; then
  echo "Operation cancelled."
  exit 0
fi

echo "Deleting all SMS logs..."
docker compose exec mongo mongosh --eval "db.smslogs.deleteMany({})"

if [ $? -eq 0 ]; then
  echo "All SMS logs have been successfully deleted."
else
  echo "An error occurred while deleting SMS logs."
fi
