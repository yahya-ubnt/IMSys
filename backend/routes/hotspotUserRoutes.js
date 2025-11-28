const express = require('express');
const router = express.Router();
const {
  createHotspotUser,
  getHotspotUsers,
  getHotspotUserById,
  updateHotspotUser,
  deleteHotspotUser,
} = require('../controllers/hotspotUserController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .post(protect, isSuperAdminOrAdmin, createHotspotUser)
  .get(protect, isSuperAdminOrAdmin, getHotspotUsers);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getHotspotUserById)
  .put(protect, isSuperAdminOrAdmin, updateHotspotUser)
  .delete(protect, isSuperAdminOrAdmin, deleteHotspotUser);

module.exports = router;
