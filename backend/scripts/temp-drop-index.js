const mongoose = require('mongoose');
const connectDB = require('../config/db');

const dropTenantIndex = async () => {
  console.log('Connecting to database to drop old index...');
  await connectDB();
  console.log('Database connected.');

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'tenants' }).toArray();
    
    if (collections.length === 0) {
      console.log('The "tenants" collection does not exist. No index to drop. Exiting.');
      process.exit(0);
    }

    const collection = db.collection('tenants');
    const indexes = await collection.indexes();
    
    const indexExists = indexes.some(index => index.name === 'domain_1');

    if (indexExists) {
      console.log('Found old index "domain_1". Dropping it now...');
      await collection.dropIndex('domain_1');
      console.log('Successfully dropped the "domain_1" index.');
    } else {
      console.log('Old index "domain_1" not found. It may have been removed already.');
    }

  } catch (error) {
    console.error('An error occurred while trying to drop the index:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

dropTenantIndex();
