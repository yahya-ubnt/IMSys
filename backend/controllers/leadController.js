const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const MikrotikUser = require('../models/MikrotikUser');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
const createLead = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phoneNumber, address, serviceOfInterest, leadSource, notes } = req.body;

  try {
    const lead = await Lead.create({
      name,
      email,
      phoneNumber,
      address,
      serviceOfInterest,
      leadSource,
      notes: sanitizeString(notes), // Sanitize notes field
      tenantOwner: req.user.tenantOwner, // Associate with the logged-in user's tenant
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all leads and dashboard stats
// @route   GET /api/leads
// @access  Private
const getAllLeads = asyncHandler(async (req, res) => {
  const { status, leadSource, broughtInBy, search } = req.query;
  const query = { tenantOwner: req.user.tenantOwner }; // Filter by tenant

  if (status) {
    query.status = status;
  }
  if (leadSource) {
    query.leadSource = leadSource;
  }
  if (broughtInBy) {
    query.broughtInBy = { $regex: broughtInBy, $options: 'i' };
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const leads = await Lead.find(query).populate('desiredPackage');

  // Dashboard Stats
  const totalLeads = await Lead.countDocuments({ tenantOwner: req.user.tenantOwner });
  const totalConvertedLeads = await Lead.countDocuments({ tenantOwner: req.user.tenantOwner, status: 'Converted' });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const newLeadsThisMonth = await Lead.countDocuments({
    tenantOwner: req.user.tenantOwner,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const convertedLeadsThisMonth = await Lead.countDocuments({
    tenantOwner: req.user.tenantOwner,
    status: 'Converted',
    updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  // Chart Data
  const leadsByMonth = await Lead.aggregate([
    { $match: { tenantOwner: req.user.tenantOwner } }, // Filter by tenant
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        newLeads: { $sum: 1 },
        convertedLeads: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'Converted'] },
                  { $eq: [{ $year: '$updatedAt' }, '$_id.year'] },
                  { $eq: [{ $month: '$updatedAt' }, '$_id.month'] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    leads,
    dashboardStats: {
      totalLeads,
      totalConvertedLeads,
      newLeadsThisMonth,
      convertedLeadsThisMonth,
    },
    chartData: leadsByMonth.map(item => ({
      month: item._id.month,
      newLeads: item.newLeads,
      convertedLeads: item.convertedLeads
    })),
  });
});

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Public
const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner }).populate('desiredPackage');
  if (lead) {
    res.json(lead);
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private/Admin
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (lead) {
    lead.name = req.body.name || lead.name;
    lead.phoneNumber = req.body.phoneNumber || lead.phoneNumber;
    lead.leadSource = req.body.leadSource || lead.leadSource;
    lead.desiredPackage = req.body.desiredPackage || lead.desiredPackage;
    lead.currentIsp = req.body.currentIsp || lead.currentIsp;
    lead.notes = req.body.notes ? sanitizeString(req.body.notes) : lead.notes;
    lead.broughtInBy = req.body.broughtInBy || lead.broughtInBy;
    lead.broughtInByContact = req.body.broughtInByContact || lead.broughtInByContact;
    lead.agreedInstallationFee =
      req.body.agreedInstallationFee || lead.agreedInstallationFee;
    lead.agreedMonthlySubscription =
      req.body.agreedMonthlySubscription || lead.agreedMonthlySubscription;
    lead.customerHasRouter = req.body.customerHasRouter || lead.customerHasRouter;
    lead.routerType = req.body.routerType || lead.routerType;
    lead.followUpDate = req.body.followUpDate || lead.followUpDate;

    const totalAmount =
      (Number(lead.agreedInstallationFee) || 0) +
      (Number(lead.agreedMonthlySubscription) || 0);
    lead.totalAmount = totalAmount;

    const updatedLead = await lead.save();
    res.json(updatedLead);
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (lead) {
    await lead.deleteOne();
    res.json({ message: 'Lead removed' });
  }
  else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

// @desc    Update lead status and optionally convert to customer
// @route   PUT /api/leads/status/:id
// @access  Private
const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status, createMikrotikUser, mikrotikUsername, mikrotikPassword, mikrotikService, mikrotikRouter } = req.body;
  const lead = await Lead.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (lead) {
    lead.status = status;
    lead.statusHistory.push({ status, changedBy: req.user ? req.user._id : null });

    if (status === 'Converted' && createMikrotikUser) {
      // Create Mikrotik User
      const mikrotikUser = new MikrotikUser({
        name: mikrotikUsername,
        password: mikrotikPassword,
        service: mikrotikService,
        router: mikrotikRouter,
        comment: `Converted from lead ${lead.name}`,
        tenantOwner: req.user.tenantOwner,
      });

      const createdMikrotikUser = await mikrotikUser.save();

      lead.isConverted = true;
      lead.mikrotikUser = createdMikrotikUser._id;
    }

    const updatedLead = await lead.save();
    res.json(updatedLead);
  } else {
    res.status(404);
    throw new Error('Lead not found');
  }
});

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
};