#!/bin/bash

# This script will PERMANENTLY DELETE ALL DATA from the specified collections in your MongoDB database.
# Use with extreme caution.

MONGO_URI="$1"

if [ -z "$MONGO_URI" ]; then
  echo "Usage: $0 <MongoDB_URI>"
  echo "Example: $0 \"mongodb://localhost:27017/your_db_name\""
  echo "Or: $0 \"mongodb+srv://user:pass@cluster.mongodb.net/your_db_name\""
  exit 1
fi

# Extract database name from MONGO_URI
DB_NAME=$(echo "$MONGO_URI" | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_NAME" ]; then
  echo "Could not extract database name from MONGO_URI. Please ensure it's in a standard format."
  exit 1
fi

echo "WARNING: This script will permanently delete all data from the following collections in database '$DB_NAME':"
echo "- mikrotikrouters"
echo "- mikrotikusers"
echo "- devices"
echo "- packages"
echo "- applicationsettings"
echo "- dailytransactions"
echo "- diagnosticlogs"
echo "- downtimelogs"
echo "- userdowntimelogs"
echo "- expenses"
echo "- expensetypes"
echo "- wallettransactions"

echo "- smsacknowledgements"
echo "- smsexpiryschedules"
echo "- smstemplates"
echo "- leads"
echo "- transactions"

read -p "Are you absolutely sure you want to proceed? Type 'yes' to continue: " CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
  echo "Aborting data clear." >&2
  exit 0
fi

echo "Proceeding with data deletion..."

# List of collections to clear
COLLECTIONS=(
  "mikrotikrouters"
  "mikrotikusers"
  "devices"
  "packages"
  "applicationsettings"
  "dailytransactions"
  "diagnosticlogs"
  "downtimelogs"
  "userdowntimelogs"
  "expenses"
  "expensetypes"
  "wallettransactions"
    "smsacknowledgements"
  "smsexpiryschedules"
  "smstemplates"
  "leads"
  "transactions"
)

for COLLECTION in "${COLLECTIONS[@]}"; do
  echo "Clearing collection: $COLLECTION"
  mongosh "$MONGO_URI" --eval "db.$COLLECTION.deleteMany({});" || {
    echo "Error clearing $COLLECTION. Aborting." >&2
    exit 1
  }
done

echo "All specified collections have been cleared."
