const express = require('express');
const router = express.Router();
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(isSuperAdminOrAdmin, createPackage).get(isSuperAdminOrAdmin, getPackages);
router.route('/:id').get(isSuperAdminOrAdmin, getPackageById).put(isSuperAdminOrAdmin, updatePackage).delete(isSuperAdminOrAdmin, deletePackage);

module.exports = router;
