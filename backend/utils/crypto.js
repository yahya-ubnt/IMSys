const crypto = require('crypto');
const { ENCRYPTION_KEY } = require('../config/secrets'); // Import from secrets module

const IV_LENGTH = 16; // For AES, this is always 16

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  if (text === null || typeof text === 'undefined') {
    return text;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  // If text is not a non-empty string or doesn't contain the separator, return it as is.
  if (typeof text !== 'string' || !text || !text.includes(':')) {
    return text;
  }
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
