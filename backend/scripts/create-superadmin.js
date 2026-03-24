const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');
const path = require('path');

// Configure dotenv to use the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

connectDB();

const createAdmin = async () => {
  try {
    // Get arguments from command line: node create-admin.js "FullName" "email" "password"
    const [,, fullName, email, password] = process.argv;

    if (!fullName || !email || !password) {
      console.error('Usage: node create-admin.js "Full Name" "email@example.com" "password"');
      console.log('Note: Arguments with spaces must be wrapped in quotes.');
      process.exit(1);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.error(`Error: A user with the email "${email}" already exists.`);
      process.exit(1);
    }

    // Create user with SUPER_ADMIN role
    const user = await User.create({
      fullName,
      email,
      password, // The model's pre-save hook will handle hashing
      roles: ['SUPER_ADMIN'],
    });

    console.log('✅ SUPER_ADMIN user created successfully:');
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);

    process.exit();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
