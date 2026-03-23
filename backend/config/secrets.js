const fs = require('fs');
const path = require('path');

const readSecret = (secretName, envVarName) => {
  const secretPath = path.join('/run/secrets', secretName);
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  return process.env[envVarName];
};

const JWT_SECRET = readSecret('jwt_secret', 'JWT_SECRET');
const ENCRYPTION_KEY = readSecret('encryption_key', 'ENCRYPTION_KEY');

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('FATAL ERROR: ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
}

module.exports = {
  JWT_SECRET,
  ENCRYPTION_KEY,
};
