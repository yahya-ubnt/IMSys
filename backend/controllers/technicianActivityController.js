const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const TechnicianActivity = require('../models/TechnicianActivity');

// @desc    Create a new technician activity
// @route   POST /api/technician-activities
// @access  Private (Admin/Technician)
const createTechnicianActivity = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { technician, activityType, clientName, clientPhone, activityDate, description, installedEquipment, installationNotes, issueDescription, solutionProvided, partsReplaced, configurationChanges, unit, building, supportCategory } = req.body;

  // Type-specific validation
  if (activityType === 'Installation') {
    if (!installedEquipment || !installationNotes) {
      res.status(400);
      throw new Error('For Installation, installedEquipment and installationNotes are required');
    }
  } else if (activityType === 'Support') {
    if (!issueDescription || !solutionProvided) {
      res.status(400);
      throw new Error('For Support, issueDescription and solutionProvided are required');
    }
    // ADDED supportCategory validation for Support type
    if (!supportCategory) {
      res.status(400);
      throw new Error('For Support, supportCategory is required');
    }
    if (supportCategory === 'Building Issue' && !building) {
      res.status(400);
      throw new Error('For Building Issue support, building is required');
    }
  }

  const activity = await TechnicianActivity.create({
    technician,
    activityType,
    clientName,
    clientPhone,
    activityDate,
    description,
    installedEquipment: activityType === 'Installation' ? installedEquipment : undefined,
    installationNotes: activityType === 'Installation' ? installationNotes : undefined,
    supportCategory: activityType === 'Support' ? supportCategory : undefined, // ADDED supportCategory
    issueDescription: activityType === 'Support' ? issueDescription : undefined,
    solutionProvided: activityType === 'Support' ? solutionProvided : undefined,
    partsReplaced: partsReplaced || undefined,
    configurationChanges: configurationChanges || undefined,
    unit: unit || undefined,
    building: building || undefined,
    tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
  });

  res.status(201).json(activity);
});

// @desc    Get a list of technician activities
// @route   GET /api/technician-activities
// @access  Private (Admin/Technician)
const getTechnicianActivities = asyncHandler(async (req, res) => {
  const { technicianId, activityType, startDate, endDate, clientName, clientPhone } = req.query;

  let query = {};
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  if (technicianId) {
    query.technician = technicianId;
  }
  if (activityType) {
    query.activityType = activityType;
  }
  if (startDate || endDate) {
    query.activityDate = {};
    if (startDate) {
      query.activityDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.activityDate.$lte = new Date(endDate);
    }
  }
  if (clientName) {
    query.clientName = { $regex: clientName, $options: 'i' }; // Case-insensitive search
  }
  if (clientPhone) {
    query.clientPhone = { $regex: clientPhone, $options: 'i' }; // Case-insensitive search
  }

  const activities = await TechnicianActivity.find(query)
    .sort({ activityDate: -1 })
    .populate('unit', 'label') // Populate unit label
    .populate('building', 'name'); // Populate building name

  res.status(200).json(activities);
});

// @desc    Get a single technician activity by ID
// @route   GET /api/technician-activities/:id
// @access  Private (Admin/Technician)
const getTechnicianActivityById = asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };
  if (!req.user.roles.includes('SUPER_ADMIN')) {
    query.tenantOwner = req.user.tenantOwner;
  }

  const activity = await TechnicianActivity.findOne(query)
    .populate('unit', 'label')
    .populate('building', 'name');

  if (!activity) {
    res.status(404);
    throw new Error('Technician activity not found');
  }

  res.status(200).json(activity);
});

// @desc    Update an existing technician activity
// @route   PUT /api/technician-activities/:id
// @access  Private (Admin/Technician)
const updateTechnicianActivity = asyncHandler(async (req, res) => {
  const { technician, activityType, clientName, clientPhone, activityDate, description, installedEquipment, installationNotes, issueDescription, solutionProvided, partsReplaced, configurationChanges, unit, building, supportCategory } = req.body;

  let activity = await TechnicianActivity.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!activity) {
    res.status(404);
    throw new Error('Technician activity not found');
  }

  // Update fields
  activity.technician = technician || activity.technician;
  activity.activityType = activityType || activity.activityType;
  activity.clientName = clientName || activity.clientName;
  activity.clientPhone = clientPhone || activity.clientPhone;
  activity.activityDate = activityDate || activity.activityDate;
  activity.description = description || activity.description;
  activity.supportCategory = supportCategory || activity.supportCategory; // ADDED supportCategory assignment

  // Update type-specific fields
  if (activity.activityType === 'Installation') {
    activity.installedEquipment = installedEquipment || activity.installedEquipment;
    activity.installationNotes = installationNotes || activity.installationNotes;
    // Clear support-specific fields if changing type
    activity.issueDescription = undefined;
    activity.solutionProvided = undefined;
  } else if (activity.activityType === 'Support') {
    // Validation for supportCategory
    if (!activity.supportCategory) { // Use activity.supportCategory as it might be updated
      res.status(400);
      throw new Error('For Support, supportCategory is required');
    }
    if (activity.supportCategory === 'Building Issue') {
      if (!building) {
        res.status(400);
        throw new Error('For Building Issue support, building is required');
      }
      activity.building = building || activity.building; // Assign building if Building Issue
      activity.unit = unit || activity.unit; // Assign unit if Building Issue
    } else { // If not Building Issue, clear building/unit
      activity.building = undefined;
      activity.unit = undefined;
    }

    activity.issueDescription = issueDescription || activity.issueDescription;
    activity.solutionProvided = solutionProvided || activity.solutionProvided;
    partsReplaced = partsReplaced || activity.partsReplaced;
    configurationChanges = configurationChanges || activity.configurationChanges;
    // Clear installation-specific fields if changing type
    activity.installedEquipment = undefined;
    activity.installationNotes = undefined;
  }

  // Ensure unit and building are cleared if activityType changes from Support/Installation
  if (activityType && activityType !== activity.activityType) { // If activityType is being changed
    activity.unit = undefined;
    activity.building = undefined;
  }

  activity.partsReplaced = partsReplaced || activity.partsReplaced; // Moved this line
  activity.configurationChanges = configurationChanges || activity.configurationChanges; // Moved this line
  activity.unit = unit || undefined; // Moved this line
  activity.building = building || undefined; // Moved this line

  const updatedActivity = await activity.save();

  res.status(200).json(updatedActivity);
});

// @desc    Delete a technician activity
// @route   DELETE /api/technician-activities/:id
// @access  Private (Admin/Technician)
const deleteTechnicianActivity = asyncHandler(async (req, res) => {
  const activity = await TechnicianActivity.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!activity) {
    res.status(404);
    throw new Error('Technician activity not found');
  }

  await activity.deleteOne();

  res.status(200).json({ message: 'Technician activity removed' });
});

module.exports = {
  createTechnicianActivity,
  getTechnicianActivities,
  getTechnicianActivityById,
  updateTechnicianActivity,
  deleteTechnicianActivity,
};