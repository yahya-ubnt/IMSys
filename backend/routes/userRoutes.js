const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  loginUser,
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
const { protect, isSuperAdmin, isAdminTenant } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', loginUser);

// Authenticated user routes
router.route('/profile').get(protect, getUserProfile);

// SUPER_ADMIN routes for managing all users
router.route('/').get(protect, isSuperAdmin, getUsers).post(
  [protect, isSuperAdmin],
  [
    body('fullName', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('roles', 'Roles are required').isArray({ min: 1 }),
  ],
  createUser
);
router
  .route('/:id')
  .get(protect, isSuperAdmin, getUserById)
  .put(
    [protect, isSuperAdmin],
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

// ADMIN_TENANT routes for managing their own users
router.route('/my-users').get(protect, isAdminTenant, getTenantUsers).post(
  [protect, isAdminTenant],
  [
    body('fullName', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
  ],
  createTenantUser
);
router
    .route('/my-users/:id')
    .get(protect, isAdminTenant, getTenantUserById)
    .put(protect, isAdminTenant, updateTenantUser)
    .delete(protect, isAdminTenant, deleteTenantUser);

module.exports = router;
