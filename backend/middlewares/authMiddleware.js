const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token;

  if (req.cookies.token) {
    try {
      token = req.cookies.token;

      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

exports.isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a Super Admin');
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes('ADMIN')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an Admin');
  }
};

exports.isSuperAdminOrAdmin = (req, res, next) => {
  if (req.user && (req.user.roles.includes('SUPER_ADMIN') || req.user.roles.includes('ADMIN'))) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized for this resource');
  }
};
