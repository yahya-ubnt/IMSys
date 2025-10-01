const CryptoJS = require('crypto-js');
const { CRYPTO_SECRET } = require('../config/env'); // Import CRYPTO_SECRET from env config

if (!CRYPTO_SECRET) {
  throw new Error('CRYPTO_SECRET is not defined in the environment variables.');
}

// Encrypt function
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text.toString(), CRYPTO_SECRET).toString();
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext.toString(), CRYPTO_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = { encrypt, decrypt };