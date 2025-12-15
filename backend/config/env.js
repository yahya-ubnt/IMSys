// backend/config/env.js
// Environment variables are now injected by Docker Compose.

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  SMS_API_KEY: process.env.SMS_API_KEY,

  // M-Pesa Daraja API Configuration
  DARAJA_ENV: process.env.DARAJA_ENV,
  DARAJA_CONSUMER_KEY: process.env.DARAJA_CONSUMER_KEY,
  DARAJA_CONSUMER_SECRET: process.env.DARAJA_CONSUMER_SECRET,
  DARAJA_SHORTCODE: process.env.DARAJA_SHORTCODE,
  DARAJA_PASSKEY: process.env.DARAJA_PASSKEY,
  DARAJA_CALLBACK_URL: process.env.DARAJA_CALLBACK_URL,

  CRYPTO_SECRET: process.env.CRYPTO_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};
