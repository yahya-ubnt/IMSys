const mongoose = require('mongoose');
const MikrotikRouter = require('../models/MikrotikRouter');
const MikrotikUser = require('../models/MikrotikUser');
const connectDB = require('../config/db'); // Import the connectDB function

// Load environment variables
require('dotenv').config({ path: '../.env' }); // Adjust path if .env is in root

// Connect to the database
connectDB();

const deleteAllRoutersAndUsers = async () => {
  try {
    console.log('Deleting all Mikrotik Routers...');
    const routerDeleteResult = await MikrotikRouter.deleteMany({});
    console.log(`${routerDeleteResult.deletedCount} Mikrotik Routers deleted.`);

    console.log('Deleting all Mikrotik Users...');
    const userDeleteResult = await MikrotikUser.deleteMany({});
    console.log(`${userDeleteResult.deletedCount} Mikrotik Users deleted.`);

    console.log('All Mikrotik data cleared successfully.');
  } catch (error) {
    console.error(`Error deleting data: ${error.message}`);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

deleteAllRoutersAndUsers();