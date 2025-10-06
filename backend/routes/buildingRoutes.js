const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const buildingController = require('../controllers/buildingController');
const { protect, admin } = require('../middlewares/protect');

// Define building routes
router.route('/').get(buildingController.getAllBuildings).post(buildingController.createBuilding);
router.route('/:id').get(buildingController.getBuildingById).put(
  protect,
  admin,
  [
    body('name', 'Name must be a string').optional().isString(),
    body('address', 'Address must be a string').optional().isString(),
    body('gps.lat', 'Latitude must be a number').optional().isNumeric(),
    body('gps.lng', 'Longitude must be a number').optional().isNumeric(),
    body('staffPhone', 'Staff phone number must be valid').optional().matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
    body('totalUnits', 'Total units must be a number').optional().isNumeric(),
    body('equipment', 'Equipment must be an array').optional().isArray(),
    body('reversePoeSwitches', 'Reverse PoE switches must be an array').optional().isArray(),
  ],
  buildingController.updateBuilding
).delete(protect, admin, buildingController.deleteBuilding);

module.exports = router;