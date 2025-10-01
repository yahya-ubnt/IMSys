const axios = require('axios');
const { DARAJA_ENV, DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET } = require('../config/env');

let token = null;
let tokenExpiry = null;

const getDarajaToken = async () => {
  // If token exists and is not expired, return it
  if (token && tokenExpiry && new Date() < tokenExpiry) {
    return token;
  }

  const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');
  const url = DARAJA_ENV === 'production' 
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    token = response.data.access_token;
    // Set expiry to 59 minutes from now to be safe
    tokenExpiry = new Date(new Date().getTime() + 59 * 60 * 1000);
    
    console.log('--- Daraja Token Generated ---');
    return token;
  } catch (error) { 
    console.error('Error fetching Daraja token:', error.response ? error.response.data : error.message);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw new Error('Could not fetch Daraja access token.');
  }
};

module.exports = { getDarajaToken };
