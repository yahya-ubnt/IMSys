const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createHotspotUser,
  getHotspotUsers,
  getHotspotUserById,
  updateHotspotUser,
  deleteHotspotUser,
} = require('../controllers/hotspotUserController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router
  .route('/')
  .post(
    protect,
    isSuperAdminOrAdmin,
    [
      body('officialName', 'Official name is required').not().isEmpty(),
      body('hotspotName', 'Hotspot username is required and can only contain alphanumeric characters, hyphens, and underscores').not().isEmpty().matches(/^[a-zA-Z0-9_-]+$/),
      body('hotspotPassword', 'Hotspot password is required').not().isEmpty(),
      body('profile', 'Profile is required').not().isEmpty(),
      body('phoneNumber', 'Phone number is required').not().isEmpty(),
      body('mikrotikRouter', 'Mikrotik Router ID is required').isMongoId(),
      body('package', 'Package ID is required').isMongoId(),
    ],
    createHotspotUser
  )
  .get(protect, isSuperAdminOrAdmin, getHotspotUsers);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getHotspotUserById)
  .put(
    protect,
    isSuperAdminOrAdmin,
    [
      body('officialName', 'Official name must be a string').optional().isString(),
      body('hotspotName', 'Hotspot username can only contain alphanumeric characters, hyphens, and underscores').optional().matches(/^[a-zA-Z0-9_-]+$/),
      body('hotspotPassword', 'Hotspot password must be a string').optional().isString(),
      body('profile', 'Profile must be a string').optional().isString(),
      body('phoneNumber', 'Phone number must be a string').optional().isString(),
      body('mikrotikRouter', 'Mikrotik Router ID is invalid').optional().isMongoId(),
      body('package', 'Package ID is invalid').optional().isMongoId(),
    ],
    updateHotspotUser
  )
  .delete(protect, isSuperAdminOrAdmin, deleteHotspotUser);

module.exports = router;