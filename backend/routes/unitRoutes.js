// backend/routes/unitRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const unitController = require('../controllers/unitController');
const { protect, admin } = require('../middlewares/protect');

// Define unit routes
router.route('/').get(unitController.getAllUnits).post(protect, unitController.createUnit);
router.route('/:unitId').get(unitController.getUnitById).put(protect, unitController.updateUnit).delete(protect, unitController.deleteUnit);

module.exports = router;