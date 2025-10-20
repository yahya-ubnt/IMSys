'use strict';

// This script adds the 'status' field to existing tenant documents that don't have it.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const migrate = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  try {
    console.log("Starting migration: Add 'status' field to tenants...");

    const result = await User.updateMany(
      { 
        roles: 'ADMIN_TENANT', 
        status: { $exists: false } // Find all tenants where the status field does not exist
      }, 
      { 
        $set: { status: 'Active' } // Set the default status to 'Active'
      }
    );

    console.log('--- Migration Report ---');
    console.log(`Tenants matched for update: ${result.matchedCount}`);
    console.log(`Tenants successfully updated: ${result.modifiedCount}`);
    console.log('------------------------');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    console.log('Closing database connection...');
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit();
  }
};

migrate();
