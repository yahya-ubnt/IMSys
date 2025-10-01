// backend/routes/buildingRoutes.js
const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const { protect, admin } = require('../middlewares/protect');

// Define building routes
router.route('/').get(buildingController.getAllBuildings).post(buildingController.createBuilding);
router.route('/:id').get(buildingController.getBuildingById).put(protect, admin, buildingController.updateBuilding).delete(protect, admin, buildingController.deleteBuilding);

module.exports = router;