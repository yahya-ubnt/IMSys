const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SmsLog = require('../models/SmsLog');

const updateSmsLogMessageType = async () => {
  try {
    await connectDB();

    const result = await SmsLog.updateMany(
      { messageType: 'Compose New Message' },
      { $set: { messageType: 'Compose' } }
    );

    console.log(`Updated ${result.modifiedCount} documents.`);
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error updating SMS log message types:', error);
    process.exit(1);
  }
};

updateSmsLogMessageType();
