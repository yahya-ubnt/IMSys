const asyncHandler = require('express-async-handler');
const generateToken = require('../generateToken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email); // Log the email received
  console.log('Password received (for debugging, remove in production):', password); // Log password (CAUTION: remove in production)

  const user = await User.findOne({ email });

  if (user) {
    console.log('User found in DB:', user); // Log if user is found
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch); // Log the result of password comparison

    if (isMatch) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } else {
    console.log('User not found for email:', email); // Log if user is not found
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
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, isAdmin } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please enter email and password');
  }

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
    isAdmin: isAdmin !== undefined ? isAdmin : false,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, isAdmin } = req.body;

  const user = await User.findById(req.params.id);

  if (user) {
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    if (password) {
      user.password = password;
    }
    user.phone = phone || user.phone;
    if (isAdmin !== undefined) {
      user.isAdmin = isAdmin;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Soft delete
    user.status = 'Inactive'; // Assuming status field exists in User model
    await user.save();
    res.json({ message: 'User set to Inactive' });
  } else {
    res.status(404);
    throw new Error('User not found');
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
};