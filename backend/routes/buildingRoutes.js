const express = require('express');
const {
  getBuildings,
  getBuilding,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require('../controllers/buildingController');

const Building = require('../models/Building');
const { protect, isAdmin } = require('../middlewares/protect');

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router
  .route('/')
  .get(getBuildings)
  .post(createBuilding);

router
  .route('/:id')
  .get(getBuilding)
  .put(updateBuilding)
  .delete(deleteBuilding);

module.exports = router;
