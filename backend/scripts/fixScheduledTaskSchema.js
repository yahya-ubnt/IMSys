const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ScheduledTask = require('../models/ScheduledTask');

const fixScheduledTaskSchema = async () => {
  await connectDB();
  console.log('Connected to MongoDB.');

  try {
    // 1. Drop the incorrect index
    console.log('Attempting to drop the old "name_1_tenantOwner_1" index...');
    try {
      await ScheduledTask.collection.dropIndex('name_1_tenantOwner_1');
      console.log('Successfully dropped the old index.');
    } catch (error) {
      if (error.code === 27) { // 27 is the error code for "IndexNotFound"
        console.log('Old index "name_1_tenantOwner_1" not found, skipping drop.');
      } else {
        throw error;
      }
    }

    // 2. Delete tasks that have the old 'tenantOwner' field
    console.log('Deleting scheduled tasks that use the old "tenantOwner" field...');
    const deleteResult = await ScheduledTask.deleteMany({ tenantOwner: { $exists: true } });
    console.log(`Deleted ${deleteResult.deletedCount} old scheduled tasks.`);

    // 3. Ensure the correct index is in place
    console.log('Ensuring the correct "name_1_tenant_1" index exists...');
    await ScheduledTask.syncIndexes();
    console.log('Indexes are now in sync with the model definition.');

    console.log('Schema cleanup completed successfully!');
  } catch (error) {
    console.error('Error during schema cleanup process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

fixScheduledTaskSchema();
