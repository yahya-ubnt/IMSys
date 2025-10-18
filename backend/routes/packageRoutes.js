const express = require('express');
const router = express.Router();
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(protect, isSuperAdminOrAdminTenant, createPackage).get(protect, isSuperAdminOrAdminTenant, getPackages);
router.route('/:id').get(protect, isSuperAdminOrAdminTenant, getPackageById).put(protect, isSuperAdminOrAdminTenant, updatePackage).delete(protect, isSuperAdminOrAdminTenant, deletePackage);

module.exports = router;
