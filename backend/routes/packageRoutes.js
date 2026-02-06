const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');
const {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');

router.route('/').post(
    protect, 
    isSuperAdminOrAdmin, 
    [
        body('name', 'Package name is required').not().isEmpty(),
        body('price', 'Price must be a number').isNumeric(),
        body('speed', 'Speed must be a number').isNumeric(),
        body('type', 'Package type is required').not().isEmpty(),
    ],
    createPackage)
    .get(protect, isSuperAdminOrAdmin, getPackages);
router.route('/:id').get(protect, isSuperAdminOrAdmin, getPackageById).put(
    protect, 
    isSuperAdminOrAdmin,
    [
        body('name', 'Package name must be a string').optional().isString(),
        body('price', 'Price must be a number').optional().isNumeric(),
        body('speed', 'Speed must be a number').optional().isNumeric(),
        body('type', 'Package type must be a string').optional().isString(),
    ],
    updatePackage)
    .delete(protect, isSuperAdminOrAdmin, deletePackage);

module.exports = router;
