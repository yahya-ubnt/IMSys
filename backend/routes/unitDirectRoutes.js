// backend/routes/unitDirectRoutes.js
const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { protect } = require('../middlewares/protect');

router.route('/').get(protect, unitController.getAllUnits).post(protect, unitController.createUnit);
router.route('/:id').get(protect, unitController.getUnitByIdDirect);
router.route('/building/:buildingId').get(protect, unitController.getUnitsByBuilding);

module.exports = router;
