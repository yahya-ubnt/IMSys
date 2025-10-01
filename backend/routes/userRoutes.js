const express = require('express');
const router = express.Router();
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
router.route('/').get(protect, admin, getUsers).post(protect, admin, createUser);
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;