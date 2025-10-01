// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User'); // Assuming you have a User model

exports.protect = async (req, res, next) => {
  // ADD THIS CHECK FOR OPTIONS REQUESTS
  if (req.method === 'OPTIONS') {
    return next();
  }
  // END ADDITION

  let token;

  console.log('Incoming request method:', req.method); // ADDED LOG
  console.log('Incoming request URL:', req.originalUrl); // ADDED LOG
  console.log('Authorization header content:', req.headers.authorization); // ADDED LOG

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('Authorization header received:', req.headers.authorization); // Added log
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Extracted token:', token); // Added log

      // Check for dummy token (for development/testing)
      if (token === "dummy_token") {
        req.user = { id: "dummy_user_id" }; // Set a dummy user object with an id
        return next();
      }

      // Verify token (for actual JWTs)
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded); // Added log
      console.log('ID from decoded token:', decoded.id); // ADDED LOG

      // Get user from the token
      // Assuming your JWT payload has an 'id' field for the user ID
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User found by ID in middleware:', req.user); // ADDED LOG

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error); // Modified error log
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log('No token found in authorization header.'); // Added log
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error('Not authorized as an admin');
  }
};