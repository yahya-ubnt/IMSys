const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Connect to the database
connectDB();

const generateBillsFromSubscriptions = async () => {
  console.log('Automatic subscription-based invoice generation is disabled.');
  // The logic for generating invoices and wallet debits has been intentionally removed
  // to align with the prepaid business model. Invoices are now to be created manually
  // for one-off charges only.
};

// Run the script and then close the connection
generateBillsFromSubscriptions().finally(() => {
  mongoose.connection.close();
  console.log('Process finished and database connection closed.');
});