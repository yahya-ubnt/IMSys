const express = require('express');
const router = express.Router();
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(protect, isSuperAdminOrAdmin, createPackage).get(protect, isSuperAdminOrAdmin, getPackages);
router.route('/:id').get(protect, isSuperAdminOrAdmin, getPackageById).put(protect, isSuperAdminOrAdmin, updatePackage).delete(protect, isSuperAdminOrAdmin, deletePackage);

module.exports = router;
