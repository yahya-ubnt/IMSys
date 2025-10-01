// backend/controllers/buildingController.js
const mongoose = require('mongoose');
const Building = require('../models/Building'); // Keep this import for staffId validation

// @desc    Get all buildings
// @route   GET /api/buildings
// @access  Public
exports.getAllBuildings = async (req, res) => {
  try {
    const { name, address, staffName, staffPhone } = req.query;
    const query = { active: true };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (address) {
      query.address = { $regex: address, $options: 'i' };
    }
    if (staffName) {
      query.staffName = { $regex: staffName, $options: 'i' };
    }
    if (staffPhone) {
      query.staffPhone = { $regex: staffPhone, $options: 'i' };
    }

    const buildings = await Building.find(query);

    const buildingsWithStatus = buildings.map(building => {
      let status = "in-progress"; // Default to in-progress
      if (building.totalUnits > 0 && building.visitedUnits === building.totalUnits) {
        status = "completed";
      } else if (building.totalUnits === 0 || building.visitedUnits === 0) {
        status = "in-progress"; // If no units or no visited units, still in-progress
      }
      return { ...building.toObject(), status };
    });

    res.status(200).json(buildingsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single building by ID
// @route   GET /api/buildings/:id
// @access  Public
exports.getBuildingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`Invalid Building ID format received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid Building ID format' });
    }
    console.log(`Attempting to find building with ID: ${req.params.id}`);
    const building = await Building.findById(req.params.id);
    if (building && building.active) {
      res.status(200).json(building);
    } else {
      console.log(`Building with ID ${req.params.id} not found or not active.`);
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error) {
    console.error(`Error in getBuildingById: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new building
// @route   POST /api/buildings
// @access  Private/Admin
exports.createBuilding = async (req, res) => {
  const {
    name,
    address,
    gps,
    owner,
    staffName,
    staffPhone,
    notes,
    images,
    providers,
    totalUnits,
    equipment, // New field
    reversePoeSwitches, // Added reversePoeSwitches
  } = req.body;

  try {
    const building = await Building.create({
      name,
      address,
      gps,
      owner,
      staffName,
      staffPhone,
      notes,
      images,
      providers,
      totalUnits,
      equipment, // New field
      reversePoeSwitches, // Added reversePoeSwitches
    });

    console.log("Building object before save (create):", building); // Added for debugging

    if (building) {
      res.status(201).json(building);
    } else {
      res.status(400).json({ message: 'Invalid building data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a building
// @route   PUT /api/buildings/:id
// @access  Private/Admin
exports.updateBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);

    if (building && building.active) {
      building.name = req.body.name || building.name;
      building.address = req.body.address || building.address;
      building.gps = req.body.gps || building.gps;
      building.owner = req.body.owner || building.owner;
      building.staffName = req.body.staffName || building.staffName;
      building.staffPhone = req.body.staffPhone || building.staffPhone;
      building.notes = req.body.notes || building.notes;
      building.images = req.body.images || building.images;
      building.providers = req.body.providers || building.providers;
      building.totalUnits = req.body.totalUnits || building.totalUnits; // Added to update totalUnits
      building.equipment = req.body.equipment || building.equipment; // New field
      building.reversePoeSwitches = req.body.reversePoeSwitches || building.reversePoeSwitches; // Added reversePoeSwitches

      console.log("Building object before save (update):", building); // Added for debugging

      const updatedBuilding = await building.save();
      res.status(200).json(updatedBuilding);
    } else {
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a building (soft delete)
// @route   DELETE /api/buildings/:id
// @access  Private/Admin
exports.deleteBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);

    if (building) {
      // Soft delete by default
      if (building.totalUnits === 0) {
        await building.deleteOne();
        res.status(200).json({ message: 'Building removed permanently' });
      } else {
        building.active = false;
        await building.save();
        res.status(200).json({ message: 'Building deactivated' });
      }
    } else {
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};