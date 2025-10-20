const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

// Connect to the database
connectDB();

const findTenantId = async () => {
  try {
    const tenant = await User.findOne({ email: 'admin@example.com' });
    if (tenant) {
      console.log(tenant._id);
    } else {
      console.error('Tenant not found.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    mongoose.connection.close();
  }
};

findTenantId();
