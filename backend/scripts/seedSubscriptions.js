const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Subscription = require('../models/Subscription');
const MikrotikUser = require('../models/MikrotikUser');
const User = require('../models/User');
const Package = require('../models/Package'); // Add this line

// Connect to the database
connectDB();

const seedSubscriptions = async () => {
  console.log('--- Starting Subscription Seeder ---');

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as a command-line argument.');
    process.exit(1);
  }

  try {
    // 1. Find a tenant to use for testing.
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      console.error('Error: Tenant not found.');
      return;
    }

    // 2. Find a user to use for testing.
    const testUser = await MikrotikUser.findOne({ tenantOwner: tenantId }).populate('package');
    if (!testUser) {
      console.error('Error: No Mikrotik users found for this tenant. Please create at least one user to test.');
      return;
    }

    console.log(`Found test user: '${testUser.username}' (ID: ${testUser._id})`);

    // 3. Clear any existing subscriptions for this user to ensure a clean slate.
    await Subscription.deleteMany({ mikrotikUser: testUser._id });
    console.log(`Cleared existing subscriptions for this user.`);

    // 4. Create a new subscription for the user.
    const subscription = await Subscription.create({
      tenantOwner: tenantId,
      mikrotikUser: testUser._id,
      package: testUser.package ? testUser.package._id : null,
      name: testUser.package ? testUser.package.name : 'Default Package',
      amount: testUser.package ? testUser.package.price : 1500, // Use package price or a default
      billingCycle: 'Monthly',
      status: 'Active',
    });

    console.log('Successfully created a new subscription:', subscription);

  } catch (error) {
    console.error('An error occurred during the subscription seeding process:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
seedSubscriptions();
