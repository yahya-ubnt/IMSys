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
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/protect');

router.post('/login', loginUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/').get(protect, admin, getUsers).post(
  protect,
  admin,
  [
    body('fullName', 'Full name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    body('phone', 'Phone number is required').not().isEmpty(),
  ],
  createUser
);
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;