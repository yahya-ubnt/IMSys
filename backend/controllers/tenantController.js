const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const Package = require('../models/Package');
const Bill = require('../models/Bill');
const Expense = require('../models/Expense');
const ExpenseType = require('../models/ExpenseType');
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const SmsAcknowledgement = require('../models/SmsAcknowledgement');
const SmsExpirySchedule = require('../models/SmsExpirySchedule');
const SmsLog = require('../models/SmsLog');
const SmsProvider = require('../models/SmsProvider');
const SmsTemplate = require('../models/SmsTemplate');
const TechnicianActivity = require('../models/TechnicianActivity');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const WalletTransaction = require('../models/WalletTransaction');

const Device = require('../models/Device');
const ScheduledTask = require('../models/ScheduledTask');
const { createDefaultTasksForTenant } = require('../services/scheduledTaskService');

// @desc    Get tenant stats
// @route   GET /api/tenants/stats
// @access  Private/SuperAdmin
const getTenantStats = asyncHandler(async (req, res) => {
  const totalTenants = await Tenant.countDocuments({});
  const activeTenants = await Tenant.countDocuments({ status: 'active' });
  const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });

  res.json({
    totalTenants,
    activeTenants,
    suspendedTenants,
  });
});

// @desc    Get monthly tenant growth
// @route   GET /api/tenants/monthly-growth/:year
// @access  Private/SuperAdmin
const getMonthlyTenantGrowth = asyncHandler(async (req, res) => {
  const year = parseInt(req.params.year, 10);

  const monthlyGrowth = await Tenant.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formattedData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: 0,
  }));

  monthlyGrowth.forEach(item => {
    const monthIndex = item._id - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      formattedData[monthIndex].total = item.count;
    }
  });

  res.json(formattedData);
});

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private/SuperAdmin
const getTenants = asyncHandler(async (req, res) => {
  const tenants = await Tenant.find({}).populate('owner', 'fullName email phone');
  res.json(tenants);
});

// @desc    Create a new tenant and its first admin user
// @route   POST /api/tenants
// @access  Private/SuperAdmin
const createTenant = asyncHandler(async (req, res) => {
  const { tenantName, fullName, email, password, phone } = req.body;

  if (!tenantName || !fullName || !email || !password || !phone) {
    res.status(400);
    throw new Error('Please provide tenantName, and user details: fullName, email, password, and phone.');
  }

  const tenantExists = await Tenant.findOne({ name: tenantName });
  if (tenantExists) {
    res.status(400);
    throw new Error('A tenant with this name already exists.');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists.');
  }

  let newTenant;
  try {
    // Step 1: Create the Tenant
    newTenant = await Tenant.create({ name: tenantName });

    // Step 2: Create the first Admin User for this Tenant
    const adminUser = await User.create({
      fullName,
      email,
      password,
      phone,
      roles: ['ADMIN'],
      tenant: newTenant._id,
    });

    // Step 3: Update the tenant with the owner's ID
    newTenant.owner = adminUser._id;
    await newTenant.save();

    // Step 4: Create the default scheduled tasks for the new tenant
    await createDefaultTasksForTenant(newTenant._id);

    res.status(201).json({
      message: 'Tenant and Admin User created successfully.',
      tenant: newTenant,
      user: {
        _id: adminUser._id,
        fullName: adminUser.fullName,
        email: adminUser.email,
      },
    });
  } catch (error) {
    // If something goes wrong, we should try to clean up.
    if (newTenant) {
      await Tenant.findByIdAndDelete(newTenant._id);
    }
    console.error("Error during tenant creation:", error);
    res.status(500).json({ message: "Failed to create tenant due to a server error." });
  }
});

// @desc    Get a single tenant by ID
// @route   GET /api/tenants/:id
// @access  Private/SuperAdmin
const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).populate('owner', 'fullName email phone');
  if (tenant) {
    res.json(tenant);
  } else {
    res.status(404);
    throw new Error('Tenant not found');
  }
});

// @desc    Update a tenant
// @route   PUT /api/tenants/:id
// @access  Private/SuperAdmin
const updateTenant = asyncHandler(async (req, res) => {
  const { name, status, fullName, email, phone } = req.body;
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    tenant.name = name || tenant.name;
    tenant.status = status || tenant.status;

    if (tenant.owner) {
      const owner = await User.findById(tenant.owner);
      if (owner) {
        owner.fullName = fullName || owner.fullName;
        owner.email = email || owner.email;
        owner.phone = phone || owner.phone;
        await owner.save();
      }
    }

    const updatedTenant = await tenant.save();
    const populatedTenant = await Tenant.findById(updatedTenant._id).populate('owner', 'fullName email phone');
    res.json(populatedTenant);
  } else {
    res.status(404);
    throw new Error('Tenant not found');
  }
});

// @desc    Delete a tenant and all associated data
// @route   DELETE /api/tenants/:id
// @access  Private/SuperAdmin
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (tenant) {
    const tenantId = tenant._id;

    // This is a very destructive operation.
    await MikrotikUser.deleteMany({ tenant: tenantId });
    await MikrotikRouter.deleteMany({ tenant: tenantId });
    await Package.deleteMany({ tenant: tenantId });
    await Bill.deleteMany({ tenant: tenantId });
    await Expense.deleteMany({ tenant: tenantId });
    await ExpenseType.deleteMany({ tenant: tenantId });
    await Lead.deleteMany({ tenant: tenantId });
    await Notification.deleteMany({ tenant: tenantId });
    await SmsAcknowledgement.deleteMany({ tenant: tenantId });
    await SmsExpirySchedule.deleteMany({ tenant: tenantId });
    await SmsLog.deleteMany({ tenant: tenantId });
    await SmsProvider.deleteMany({ tenant: tenantId });
    await SmsTemplate.deleteMany({ tenant: tenantId });
    await TechnicianActivity.deleteMany({ tenant: tenantId });
    await Ticket.deleteMany({ tenant: tenantId });
    await Transaction.deleteMany({ tenant: tenantId });
    await WalletTransaction.deleteMany({ tenant: tenantId });
        await Device.deleteMany({ tenant: tenantId });
    await ScheduledTask.deleteMany({ tenant: tenantId });
    
    // Delete all users associated with this tenant
    await User.deleteMany({ tenant: tenantId });
    
    // Finally, delete the tenant themselves
    await tenant.deleteOne();

    res.json({ message: 'Tenant and all associated data removed' });
  } else {
    res.status(404);
    throw new Error('Tenant not found');
  }
});

module.exports = {
  getTenantStats,
  getMonthlyTenantGrowth,
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
};
