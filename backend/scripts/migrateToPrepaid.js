// backend/scripts/migrateToPrepaid.js

/**
 * One-time migration script to transition users from the old billing model
 * to the new expiry-date-based prepaid model.
 */

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const Transaction = require('../models/Transaction');

const runMigration = async () => {
  const isDryRun = !process.argv.includes('--execute');
  if (isDryRun) {
    console.log('--- RUNNING IN DRY RUN MODE ---');
    console.log('No changes will be saved to the database. To execute, run with the --execute flag.');
  } else {
    console.log('--- RUNNING IN EXECUTE MODE ---');
    console.log('Changes WILL be saved to the database.');
  }

  console.log('Starting user migration to prepaid model...');

  try {
    // --- Step 1: Handle currently suspended users ---
    console.log('\nProcessing suspended users...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const suspendedUsersQuery = { isSuspended: true, $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: new Date() } }] };
    const suspendedUsersToUpdate = await MikrotikUser.find(suspendedUsersQuery);

    console.log(`- Found ${suspendedUsersToUpdate.length} suspended users who need their expiry date corrected.`);
    if (!isDryRun) {
      const suspendedUpdateResult = await MikrotikUser.updateMany(suspendedUsersQuery, { $set: { expiryDate: yesterday } });
      console.log(`- Executed update for ${suspendedUpdateResult.modifiedCount} suspended users.`);
    }

    // --- Step 2: Handle active users ---
    console.log('\nProcessing active users...');
    const activeUsers = await MikrotikUser.find({
      isSuspended: false,
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $lt: new Date() } }]
    }).populate('package');

    console.log(`- Found ${activeUsers.length} active users to migrate.`);
    let migratedCount = 0;

    for (const user of activeUsers) {
      const lastTransaction = await Transaction.findOne({ mikrotikUser: user._id }).sort({ transactionDate: -1 });

      if (lastTransaction && user.package && user.package.durationInDays) {
        const newExpiryDate = new Date(lastTransaction.transactionDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + user.package.durationInDays);

        console.log(`  - User: ${user.username} (ID: ${user._id})`);
        console.log(`    - Last Payment: ${lastTransaction.transactionDate.toISOString()}`);
        console.log(`    - Package: ${user.package.name} (${user.package.durationInDays} days)`);
        console.log(`    - Calculated Expiry: ${newExpiryDate.toISOString()}`);

        if (newExpiryDate < new Date()) {
          console.log('    - Status: Calculated expiry is in the past. User will be SUSPENDED.');
          if (!isDryRun) {
            user.isSuspended = true;
          }
        } else {
          console.log('    - Status: Calculated expiry is in the future. User remains ACTIVE.');
        }
        
        if (!isDryRun) {
          user.expiryDate = newExpiryDate;
          await user.save();
        }
        migratedCount++;
      } else {
        console.log(`  - User: ${user.username} (ID: ${user._id}) - SKIPPED (no transaction or package duration found)`);
      }
    }
    console.log(`- Processed ${migratedCount} active users.`);
    
    console.log('\nMigration script finished.');

  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

// Connect to DB and run the migration
(async () => {
  await connectDB();
  await runMigration();
})();
