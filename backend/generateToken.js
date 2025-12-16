const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/env');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      tenant: user.tenant, 
      roles: user.roles 
    }, 
    JWT_SECRET, 
    {
      expiresIn: '3d',
    }
  );
};

module.exports = generateToken;