// backend/config/env.js
// This file is for environment variables. In a real application, you would use a .env file and a library like `dotenv`.

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/referral_system',
  JWT_SECRET: process.env.JWT_SECRET,
  SMS_API_KEY: process.env.SMS_API_KEY,

  // M-Pesa Daraja API Configuration
  DARAJA_ENV: process.env.DARAJA_ENV || 'sandbox',
  DARAJA_CONSUMER_KEY: process.env.DARAJA_CONSUMER_KEY,
  DARAJA_CONSUMER_SECRET: process.env.DARAJA_CONSUMER_SECRET,
  DARAJA_SHORTCODE: process.env.DARAJA_SHORTCODE,
  DARAJA_PASSKEY: process.env.DARAJA_PASSKEY,
  DARAJA_CALLBACK_URL: process.env.DARAJA_CALLBACK_URL,

    CRYPTO_SECRET: process.env.CRYPTO_SECRET, // Explicitly export CRYPTO_SECRET
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY, // Export the encryption key
};
