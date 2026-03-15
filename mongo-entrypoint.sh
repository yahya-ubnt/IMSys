#!/bin/bash
set -e

HOSTNAME=$(hostname -f)
echo "DEBUG: HOSTNAME is ${HOSTNAME}"

# Start mongod in the background
mongod --replSet rs0 --bind_ip_all &

# Give mongod a moment to start listening
sleep 5

# Wait for mongod to be ready
until mongosh --eval "print('waited for connection')" > /dev/null 2>&1
do
   sleep 1
done

echo "Connection to mongod successful, attempting to initiate replica set..."

# Initiate replica set if not already initiated
mongosh --eval "
  try {
    rs.conf();
    print('Replica set already configured. Skipping initiation.');
  } catch (e) {
    if (e.code === 94 || e.codeName === 'NotYetInitialized') {
      print('Replica set not yet initialized. Initiating...');
      rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '${HOSTNAME}:27017' }] });
    } else {
      print('rs.conf() failed with an unexpected error: ' + e.message);
    }
  }
"

echo "MongoDB is ready."

# Bring mongod process to the foreground
wait

