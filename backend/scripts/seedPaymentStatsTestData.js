const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const WalletTransaction = require('../models/WalletTransaction');
const Package = require('../models/Package'); // Add this line

// Connect to the database
connectDB();

const seedTestData = async () => {
  try {
    console.log('--- Starting Payment Stats Test Data Seeder ---');

    // 1. Find a user to use for testing.
    const testUser = await MikrotikUser.findOne({ username: 'dellpc..' }).populate('package');
    if (!testUser) {
      console.error('Error: No Mikrotik users found in the database. Please create at least one user to test.');
      return;
    }
    if (!testUser.package) {
        console.error(`Error: The test user '${testUser.username}' does not have a package assigned. Please assign a package to the user.`);
        return;
    }
    console.log(`Found test user: '${testUser.username}' (ID: ${testUser._id})`);
    console.log(`User's package price: KES ${testUser.package.price}`);


    // 2. Clear any existing wallet transactions for this user to ensure a clean slate.
    const deleteResult = await WalletTransaction.deleteMany({ userId: testUser._id });
    console.log(`Cleared ${deleteResult.deletedCount} existing wallet transactions for this user.`);

    // 3. Create a series of predictable transactions.
    /*
    const now = new Date();
    const billAmount = testUser.package.price;
    const timestamp = Date.now(); // Unique timestamp for this run

    // --- SCENARIO 1: A LATE PAYMENT ---
    // Bill was 70 days ago, payment was 60 days ago (10 days late).
    const lateBillDate = new Date(now);
    lateBillDate.setDate(now.getDate() - 70);
    const latePaymentDate = new Date(now);
    latePaymentDate.setDate(now.getDate() - 60);

    await WalletTransaction.create({
      userId: testUser._id,
      transactionId: `DEBIT-TEST-LATE-${timestamp}`,
      type: 'Debit',
      amount: billAmount,
      source: 'Monthly Bill',
      balanceAfter: 0, // Balance is illustrative for tests
      comment: 'Test Data: Late Bill',
      createdAt: lateBillDate,
    });

    await WalletTransaction.create({
      userId: testUser._id,
      transactionId: `CREDIT-TEST-LATE-${timestamp}`,
      type: 'Credit',
      amount: billAmount,
      source: 'M-Pesa',
      balanceAfter: 0,
      comment: 'Test Data: Late Payment',
      createdAt: latePaymentDate,
    });
    console.log(`Created a LATE payment record (10 days late).`);

    // --- SCENARIO 2: AN ON-TIME PAYMENT ---
    // Bill was 40 days ago, payment was 39 days ago (1 day later, within grace period).
    const onTimeBillDate = new Date(now);
    onTimeBillDate.setDate(now.getDate() - 40);
    const onTimePaymentDate = new Date(now);
    onTimePaymentDate.setDate(now.getDate() - 39);

    await WalletTransaction.create({
      userId: testUser._id,
      transactionId: `DEBIT-TEST-ONTIME-${timestamp}`,
      type: 'Debit',
      amount: billAmount,
      source: 'Monthly Bill',
      balanceAfter: 0,
      comment: 'Test Data: On-Time Bill',
      createdAt: onTimeBillDate,
    });

    await WalletTransaction.create({
      userId: testUser._id,
      transactionId: `CREDIT-TEST-ONTIME-${timestamp}`,
      type: 'Credit',
      amount: billAmount,
      source: 'M-Pesa',
      balanceAfter: 0,
      comment: 'Test Data: On-Time Payment',
      createdAt: onTimePaymentDate,
    });
    console.log(`Created an ON-TIME payment record.`);

    // --- SCENARIO 3: A PENDING (UNPAID) BILL ---
    // Bill was 10 days ago, no payment yet.
    const pendingBillDate = new Date(now);
    pendingBillDate.setDate(now.getDate() - 10);

    await WalletTransaction.create({
      userId: testUser._id,
      transactionId: `DEBIT-TEST-PENDING-${timestamp}`,
      type: 'Debit',
      amount: billAmount,
      source: 'Monthly Bill',
      balanceAfter: 0,
      comment: 'Test Data: Pending Bill',
      createdAt: pendingBillDate,
    });
    console.log(`Created a PENDING bill record.`);
    */

    console.log('\n--- Test Data Cleanup Complete! ---');
    console.log(`\nThe wallet history for user '${testUser.username}' is now clean.`);

  } catch (error) {
    console.error('An error occurred during the test data seeding process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
seedTestData();
