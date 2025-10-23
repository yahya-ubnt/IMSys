const asyncHandler = require('express-async-handler');
const generateToken = require('../generateToken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      tenantOwner: user.tenantOwner,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      tenantOwner: user.tenantOwner,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (Super Admin only)
// @route   GET /api/users
// @access  Private/SuperAdmin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Get single user by ID (Super Admin only)
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create new user (Super Admin only)
// @route   POST /api/users
// @access  Private/SuperAdmin
const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, roles } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = new User({
    fullName,
    email,
    password,
    phone,
    roles,
  });

  if (roles.includes('ADMIN_TENANT')) {
      user.tenantOwner = user._id;
  }

  const createdUser = await user.save();

  res.status(201).json(createdUser);
});

// @desc    Update user (Super Admin only)
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, roles } = req.body;

  const user = await User.findById(req.params.id);

  if (user) {
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    if (password) {
      user.password = password;
    }
    user.phone = phone || user.phone;
    if (roles) {
        user.roles = roles;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user (Super Admin only)
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Tenant User Management ---

// @desc    Get all users within a tenant's account
// @route   GET /api/users/my-users
// @access  Private/AdminTenant
const getTenantUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ tenantOwner: req.user.tenantOwner });
    res.json(users);
});

// @desc    Create a new user within a tenant's account
// @route   POST /api/users/my-users
// @access  Private/AdminTenant
const createTenantUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const user = await User.create({
        fullName,
        email,
        password,
        phone,
        roles: ['USER'],
        tenantOwner: req.user.tenantOwner,
    });

    res.status(201).json(user);
});

// @desc    Get a single user by ID within a tenant's account
// @route   GET /api/users/my-users/:id
// @access  Private/AdminTenant
const getTenantUserById = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner }).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found in your tenancy');
    }
});

// @desc    Update a user within a tenant's account
// @route   PUT /api/users/my-users/:id
// @access  Private/AdminTenant
const updateTenantUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, phone } = req.body;

    const user = await User.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

    if (user) {
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        if (password) {
            user.password = password;
        }
        user.phone = phone || user.phone;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('User not found in your tenancy');
    }
});

// @desc    Delete a user within a tenant's account
// @route   DELETE /api/users/my-users/:id
// @access  Private/AdminTenant
const deleteTenantUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found in your tenancy');
    }
});

module.exports = {
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
};