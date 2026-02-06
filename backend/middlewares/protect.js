const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a Super Admin' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes('ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin' });
  }
};

const isSuperAdminOrAdmin = (req, res, next) => {
  if (req.user && (req.user.roles.includes('SUPER_ADMIN') || req.user.roles.includes('ADMIN'))) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized for this resource' });
  }
};

module.exports = { protect, isSuperAdmin, isAdmin, isSuperAdminOrAdmin };
