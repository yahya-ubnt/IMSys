const express = require('express');
const router = express.Router();
const {
  createHotspotUser,
  getHotspotUsers,
  getHotspotUserById,
  updateHotspotUser,
  deleteHotspotUser,
} = require('../controllers/hotspotUserController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router
  .route('/')
  .post(protect, isSuperAdminOrAdminTenant, createHotspotUser)
  .get(protect, isSuperAdminOrAdminTenant, getHotspotUsers);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getHotspotUserById)
  .put(protect, isSuperAdminOrAdminTenant, updateHotspotUser)
  .delete(protect, isSuperAdminOrAdminTenant, deleteHotspotUser);

module.exports = router;
