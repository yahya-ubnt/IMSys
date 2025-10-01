const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/protect');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(protect, createPackage).get(protect, getPackages);
router.route('/:id').get(protect, getPackageById).put(protect, updatePackage).delete(protect, deletePackage);

module.exports = router;
