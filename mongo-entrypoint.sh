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
    // Check if the replica set is already configured
    rs.conf();
    print('Replica set already configured. Skipping initiation.');
  } catch (e) {
    // If not configured, initiate the replica set
    if (e.code === 94 || e.codeName === 'NotYetInitialized') {
      print('Replica set not yet initialized. Initiating with 3 members...');
      rs.initiate({
        _id: 'rs0',
        members: [
          { _id: 0, host: 'imsys-mongo-prod:27017' },
          { _id: 1, host: 'imsys-mongo-prod2:27017' },
          { _id: 2, host: 'imsys-mongo-prod3:27017' }
        ]
      });
    } else {
      print('rs.conf() failed with an unexpected error: ' + e.message);
      throw e;
    }
  }

  // Wait for the replica set to have a primary
  print('Waiting for replica set to elect a primary...');
  while (rs.status().myState != 1) {
    sleep(1000);
  }
  print('Primary elected. Replica set is ready.');
"

echo "MongoDB is ready."

# Bring mongod process to the foreground
wait

