const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MikrotikUser = require('../models/MikrotikUser');
const Package = require('../models/Package');

// Connect to the database
connectDB();

const assignPackage = async () => {
  try {
    console.log(`--- Assigning Package to 'dellpc' ---`);

    // 1. Find the user 'dellpc'
    const user = await MikrotikUser.findOne({ username: 'dellpc..' });
    if (!user) {
      console.error(`Error: User 'dellpc' not found. Please ensure this user exists.`);
      return;
    }
    console.log(`Found user: 'dellpc'`);

    // 2. Find the first available package
    const pkg = await Package.findOne();
    if (!pkg) {
      console.error(`Error: No packages found in the database. Please create at least one package.`);
      return;
    }
    console.log(`Found package: '${pkg.name}' (ID: ${pkg._id})`);

    // 3. Assign the package to the user
    user.package = pkg._id;
    await user.save();

    console.log(`\nSuccessfully assigned package '${pkg.name}' to user '${user.username}'.`);
    console.log(`You can now run the test data seeder script again.`);

  } catch (error) {
    console.error('An error occurred while assigning the package:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
assignPackage();
