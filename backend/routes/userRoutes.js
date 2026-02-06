const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  loginUser,
  logoutUser,
  getUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTenantUsers,
  createTenantUser,
  getTenantUserById,
  updateTenantUser,
  deleteTenantUser,
} = require('../controllers/userController');
const { protect, isSuperAdmin, isAdmin } = require('../middlewares/protect');

const publicRouter = express.Router();
const privateRouter = express.Router();

// Apply rate limiting to the login route
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 1 minute',
});

// --- Public Routes ---
publicRouter.post('/login', 
  [
    loginLimiter,
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').not().isEmpty(),
  ],
  loginUser
);
publicRouter.post('/logout', logoutUser);


// --- Private Routes ---
// All routes here are protected

// Authenticated user routes
privateRouter.route('/profile').get(protect, getUserProfile);

// ADMIN routes for managing their own users
privateRouter.route('/my-users').get(protect, isAdmin, getTenantUsers).post(
  protect,
  isAdmin,
  [
    body('fullName', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
  ],
  createTenantUser
);
privateRouter
    .route('/my-users/:id')
    .get(protect, isAdmin, getTenantUserById)
    .put(protect, isAdmin, updateTenantUser)
    .delete(protect, isAdmin, deleteTenantUser);

// SUPER_ADMIN routes for managing all users
privateRouter.route('/').get(protect, isSuperAdmin, getUsers).post(
  protect,
  isSuperAdmin,
  [
    body('fullName', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('roles', 'Roles are required').isArray({ min: 1 }),
  ],
  createUser
);
privateRouter
  .route('/:id')
  .get(protect, isSuperAdmin, getUserById)
  .put(
    protect,
    isSuperAdmin,
    [
      body('fullName', 'Full name must be a string').optional().isString(),
      body('email', 'Please include a valid email').optional().isEmail(),
      body('password', 'Password must be 6 or more characters').optional().isLength({ min: 6 }),
      body('phone', 'Phone number must be valid').optional().matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
      body('roles', 'Roles must be an array').optional().isArray(),
    ],
    updateUser
  )
  .delete(protect, isSuperAdmin, deleteUser);

module.exports = { publicRouter, privateRouter };