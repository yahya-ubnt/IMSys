// backend/controllers/unitController.js
const Unit = require('../models/Unit');
const Building = require('../models/Building');

// @desc    Get all units for a building
// @route   GET /api/buildings/:buildingId/units
// @access  Public
exports.getAllUnits = async (req, res) => {
  try {
    const { visitStatus, provider } = req.query;
    const query = { buildingId: req.params.buildingId, active: true };

    if (visitStatus) {
      query.visitStatus = visitStatus;
    }

    if (provider) {
      query.provider = { $regex: provider, $options: 'i' };
    }

    const units = await Unit.find(query);
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single unit by ID
// @route   GET /api/buildings/:buildingId/units/:unitId
// @access  Public
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findOne({ _id: req.params.unitId, buildingId: req.params.buildingId, active: true });
    if (unit) {
      res.status(200).json(unit);
    } else {
      res.status(404).json({ message: 'Unit not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single unit by ID directly
// @route   GET /api/units/:id
// @access  Public
exports.getUnitByIdDirect = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (unit) {
      res.status(200).json(unit);
    } else {
      res.status(404).json({ message: 'Unit not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all units directly
// @route   GET /api/units
// @access  Public
exports.getAllUnitsDirect = async (req, res) => {
  try {
    const units = await Unit.find({}); // Fetch all units
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all units for a specific building
// @route   GET /api/units/building/:buildingId
// @access  Public
exports.getUnitsByBuilding = async (req, res) => {
  try {
    const units = await Unit.find({ buildingId: req.params.buildingId, active: true });
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new unit for a building
// @route   POST /api/buildings/:buildingId/units
// @access  Private/Admin
exports.createUnit = async (req, res) => {
  const {
    buildingId, // Get buildingId from req.body
    label,
    visitStatus,
    provider,
    clientName,
    phone,
    nextBillingDate,
    comments,
    wifiName,
    wifiPassword,
    pppoeUsername,
    pppoePassword,
    staticIpAddress,
    poeAdapter,
    active,
    wifiInstallationDate,
    initialPaymentAmount,
    routerOwnership,
  } = req.body;

  try {
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    const unit = await Unit.create({
      buildingId,
      label,
      visitStatus,
      provider,
      clientName,
      phone,
      nextBillingDate,
      comments,
      wifiName,
      wifiPassword,
      pppoeUsername,
      pppoePassword,
      staticIpAddress,
      poeAdapter,
      active,
      wifiInstallationDate,
      initialPaymentAmount,
      routerOwnership,
    });

    building.totalUnits += 1;
    await building.save();

    if (unit) {
      res.status(201).json(unit);
    } else {
      res.status(400).json({ message: 'Invalid unit data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a unit
// @route   PUT /api/buildings/:buildingId/units/:unitId
// @access  Private/Admin
exports.updateUnit = async (req, res) => {
  try {
    const updatedUnit = await Unit.findOneAndUpdate(
      { _id: req.params.unitId, buildingId: req.params.buildingId, active: true },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (updatedUnit) {
      res.status(200).json(updatedUnit);
    } else {
      res.status(404).json({ message: 'Unit not found or is inactive' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a unit (soft delete)
// @route   DELETE /api/buildings/:buildingId/units/:unitId
// @access  Private/Admin
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findOne({ _id: req.params.unitId, buildingId: req.params.buildingId });

    if (unit) {
      unit.active = false;
      await unit.save();

      const building = await Building.findById(req.params.buildingId);
      if (building) {
        building.totalUnits -= 1;
        await building.save();
      }

      res.status(200).json({ message: 'Unit deactivated' });
    } else {
      res.status(404).json({ message: 'Unit not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};