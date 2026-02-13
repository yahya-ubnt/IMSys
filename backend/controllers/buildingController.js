const asyncHandler = require('express-async-handler');
const Building = require('../models/Building');

// @desc    Get all buildings
// @route   GET /api/v1/buildings
// @access  Private/Admin
exports.getBuildings = asyncHandler(async (req, res, next) => {
  const buildings = await Building.find({ tenant: req.user.tenant });
  res.status(200).json({ success: true, data: buildings });
});

// @desc    Get single building
// @route   GET /api/v1/buildings/:id
// @access  Private/Admin
exports.getBuilding = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id);

  if (!building) {
    res.status(404);
    throw new Error(`Building not found with id of ${req.params.id}`);
  }

  res.status(200).json({ success: true, data: building });
});

// @desc    Create new building
// @route   POST /api/v1/buildings
// @access  Private/Admin
exports.createBuilding = asyncHandler(async (req, res, next) => {
  req.body.tenant = req.user.tenant;
  const building = await Building.create(req.body);
  res.status(201).json({ success: true, data: building });
});

// @desc    Update building
// @route   PUT /api/v1/buildings/:id
// @access  Private/Admin
exports.updateBuilding = asyncHandler(async (req, res, next) => {
  let building = await Building.findById(req.params.id);

  if (!building) {
    res.status(404);
    throw new Error(`Building not found with id of ${req.params.id}`);
  }

    res.status(401);
    throw new Error(`Not authorized to update this building`);

  building = await Building.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: building });
});

// @desc    Delete building
// @route   DELETE /api/v1/buildings/:id
// @access  Private/Admin
exports.deleteBuilding = asyncHandler(async (req, res, next) => {
  const building = await Building.findById(req.params.id);

  if (!building) {
    res.status(404);
    throw new Error(`Building not found with id of ${req.params.id}`);
  }
  
    res.status(401);
    throw new Error(`Not authorized to delete this building`);

  await building.remove();
  res.status(200).json({ success: true, data: {} });
});

