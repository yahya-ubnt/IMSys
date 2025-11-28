const mongoose = require('mongoose');
require('../config/env'); // Load environment variables
const connectDB = require('../config/db');
const ApplicationSettings = require('../models/ApplicationSettings');

const fixIndexAndData = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  try {
    const collection = ApplicationSettings.collection;

    console.log(`Cleaning up orphaned ApplicationSettings documents...`);
    const deleteResult = await collection.deleteMany({ tenant: { $exists: false } });
    console.log(`Deleted ${deleteResult.deletedCount} orphaned documents.`);

    const indexName = 'tenantOwner_1';
    console.log(`Checking for index '${indexName}' on collection '${collection.name}'...`);
    const indexes = await collection.listIndexes().toArray();
    const indexExists = indexes.some(index => index.name === indexName);

    if (indexExists) {
      console.log(`Found old index '${indexName}'. Dropping it...`);
      await collection.dropIndex(indexName);
      console.log(`Index '${indexName}' dropped successfully.`);
    } else {
      console.log(`Old index '${indexName}' not found. Skipping drop.`);
    }

    console.log("Ensuring new unique index exists on 'tenant' field...");
    await collection.createIndex({ tenant: 1 }, { unique: true, name: 'tenant_1' });
    console.log("New unique index on 'tenant' ensured.");

    console.log('--- INDEX AND DATA FIX COMPLETE ---');

  } catch (error) {
    console.error('An error occurred during the fix:', error);
    process.exit(1);
  }

  console.log('Fix script finished.');
  process.exit(0);
};

fixIndexAndData();