const express = require('express');
const router = express.Router();
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(protect, isAdminTenant, createPackage).get(protect, isAdminTenant, getPackages);
router.route('/:id').get(protect, isAdminTenant, getPackageById).put(protect, isAdminTenant, updatePackage).delete(protect, isAdminTenant, deletePackage);

module.exports = router;
