const express = require('express');
const router = express.Router();
const {
  createHotspotUser,
  getHotspotUsers,
  getHotspotUserById,
  updateHotspotUser,
  deleteHotspotUser,
} = require('../controllers/hotspotUserController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router
  .route('/')
  .post(isSuperAdminOrAdmin, createHotspotUser)
  .get(isSuperAdminOrAdmin, getHotspotUsers);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getHotspotUserById)
  .put(isSuperAdminOrAdmin, updateHotspotUser)
  .delete(isSuperAdminOrAdmin, deleteHotspotUser);

module.exports = router;