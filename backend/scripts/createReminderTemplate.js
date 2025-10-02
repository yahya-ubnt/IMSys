const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SmsTemplate = require('../models/SmsTemplate');

// --- Configuration ---
const TEMPLATE_NAME = 'Payment Reminder';
const TEMPLATE_BODY = 'Hello {{name}}, this is a friendly reminder that your internet subscription is due for renewal on {{expiryDate}}. You have {{daysLeft}} days left. To pay, please use your account number: {{accountNumber}}. Thank you!';

const createTemplate = async () => {
  console.log(`--- Creating SMS Template: "${TEMPLATE_NAME}" ---`);

  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    // Use findOneAndUpdate with upsert to create the template if it doesn't exist,
    // or update it if it does. This prevents creating duplicates.
    const result = await SmsTemplate.findOneAndUpdate(
      { name: TEMPLATE_NAME },
      { messageBody: TEMPLATE_BODY },
      { new: true, upsert: true, runValidators: true }
    );

    if (result) {
      console.log(`Successfully created or updated the "${TEMPLATE_NAME}" SMS template in the database.`);
    } else {
      throw new Error('Failed to create or update the template.');
    }

  } catch (error) {
    console.error('An error occurred while creating the SMS template:', error);
  } finally {
    // Ensure the database connection is closed
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Execute the script
createTemplate();
