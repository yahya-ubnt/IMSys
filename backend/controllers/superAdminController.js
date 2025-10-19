const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');
const Transaction = require('../models/Transaction');
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
const WalletTransaction = require('../models/WalletTransaction');
const WhatsAppLog = require('../models/WhatsAppLog');
const WhatsAppProvider = require('../models/WhatsAppProvider');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

// @desc    Get SUPER_ADMIN dashboard stats
// @route   GET /api/superadmin/dashboard-stats
// @access  Private/SuperAdmin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalTenants = await User.countDocuments({ roles: 'ADMIN_TENANT' });
  const totalUsers = await MikrotikUser.countDocuments({});
  const totalRoutersOnline = await MikrotikRouter.countDocuments({ isOnline: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayRevenue = await Transaction.aggregate([
    { $match: { createdAt: { $gte: today, $lte: endOfToday } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    totalTenants,
    totalUsers,
    totalRoutersOnline,
    todayRevenue: todayRevenue[0]?.total || 0,
  });
});

// @desc    Get SUPER_ADMIN dashboard stats
// @route   GET /api/super-admin/dashboard/stats
// @access  Private/SuperAdmin
const getSuperAdminDashboardStats = asyncHandler(async (req, res) => {
  const totalTenants = await User.countDocuments({ roles: 'ADMIN_TENANT' });
  const activeTenants = await User.countDocuments({ roles: 'ADMIN_TENANT', status: 'Active' });
  const totalRouters = await MikrotikRouter.countDocuments({});
  const totalUsers = await MikrotikUser.countDocuments({});

  res.json({
    totalTenants,
    activeTenants,
    totalRouters,
    totalUsers,
  });
});

// @desc    Get all tenants
// @route   GET /api/superadmin/tenants
// @access  Private/SuperAdmin
const getTenants = asyncHandler(async (req, res) => {
  const tenants = await User.find({ roles: 'ADMIN_TENANT' }).select('-password');
  res.json(tenants);
});

// @desc    Create a new tenant
// @route   POST /api/superadmin/tenants
// @access  Private/SuperAdmin
const createTenant = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const tenant = new User({
    fullName,
    email,
    password,
    phone,
    roles: ['ADMIN_TENANT'],
  });
  tenant.tenantOwner = tenant._id;

  const createdTenant = await tenant.save();

  res.status(201).json(createdTenant);
});

// @desc    Get a single tenant by ID
// @route   GET /api/superadmin/tenants/:id
// @access  Private/SuperAdmin
const getTenantById = asyncHandler(async (req, res) => {
    const tenant = await User.findOne({ _id: req.params.id, roles: 'ADMIN_TENANT' }).select('-password');
    if (tenant) {
        res.json(tenant);
    } else {
        res.status(404);
        throw new Error('Tenant not found');
    }
});

// @desc    Update a tenant
// @route   PUT /api/superadmin/tenants/:id
// @access  Private/SuperAdmin
const updateTenant = asyncHandler(async (req, res) => {
    const { fullName, email, password, phone, roles } = req.body;

    const tenant = await User.findOne({ _id: req.params.id, roles: 'ADMIN_TENANT' });

    if (tenant) {
        tenant.fullName = fullName || tenant.fullName;
        tenant.email = email || tenant.email;
        if (password) {
            tenant.password = password;
        }
        tenant.phone = phone || tenant.phone;
        if (roles) {
            tenant.roles = roles;
        }

        const updatedTenant = await tenant.save();
        res.json(updatedTenant);
    } else {
        res.status(404);
        throw new Error('Tenant not found');
    }
});

// @desc    Delete a tenant
// @route   DELETE /api/superadmin/tenants/:id
// @access  Private/SuperAdmin
const deleteTenant = asyncHandler(async (req, res) => {
    const tenant = await User.findOne({ _id: req.params.id, roles: 'ADMIN_TENANT' });

    if (tenant) {
        // This is a very destructive operation. We need to delete all data associated with this tenant.
        const tenantId = tenant._id;

        await MikrotikUser.deleteMany({ tenantOwner: tenantId });
        await MikrotikRouter.deleteMany({ tenantOwner: tenantId });
        await Package.deleteMany({ tenantOwner: tenantId });
        await Bill.deleteMany({ tenantOwner: tenantId });
        await Expense.deleteMany({ tenantOwner: tenantId });
        await ExpenseType.deleteMany({ tenantOwner: tenantId });
        await Lead.deleteMany({ tenantOwner: tenantId });
        await Notification.deleteMany({ tenantOwner: tenantId });
        await SmsAcknowledgement.deleteMany({ tenantOwner: tenantId });
        await SmsExpirySchedule.deleteMany({ tenantOwner: tenantId });
        await SmsLog.deleteMany({ tenantOwner: tenantId });
        await SmsProvider.deleteMany({ tenantOwner: tenantId });
        await SmsTemplate.deleteMany({ tenantOwner: tenantId });
        await TechnicianActivity.deleteMany({ tenantOwner: tenantId });
        await Ticket.deleteMany({ tenantOwner: tenantId });
        await Transaction.deleteMany({ tenantOwner: tenantId });
        await WalletTransaction.deleteMany({ tenantOwner: tenantId });
        await WhatsAppLog.deleteMany({ tenantOwner: tenantId });
        await WhatsAppProvider.deleteMany({ tenantOwner: tenantId });
        await WhatsAppTemplate.deleteMany({ tenantOwner: tenantId });
        await User.deleteMany({ tenantOwner: tenantId }); // Delete standard users
        await tenant.deleteOne(); // Delete the tenant themselves

        res.json({ message: 'Tenant and all associated data removed' });
    } else {
        res.status(404);
        throw new Error('Tenant not found');
    }
});

// @desc    Get router count per tenant
// @route   GET /api/super-admin/dashboard/routers-per-tenant
// @access  Private/SuperAdmin
const getRoutersPerTenant = asyncHandler(async (req, res) => {
  const routersPerTenant = await MikrotikRouter.aggregate([
    {
      $group: {
        _id: '$tenantOwner',
        routerCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'tenant',
      },
    },
    {
      $unwind: {
        path: '$tenant',
        preserveNullAndEmptyArrays: true // Keep tenants even if user is deleted
      }
    },
    {
      $project: {
        _id: 0,
        tenantName: { $ifNull: ['$tenant.fullName', 'Unknown Tenant'] },
        routerCount: 1,
      },
    },
  ]);
  res.json(routersPerTenant);
});

// @desc    Get user count per package
// @route   GET /api/super-admin/dashboard/users-by-package
// @access  Private/SuperAdmin
const getUsersByPackage = asyncHandler(async (req, res) => {
  const usersByPackage = await MikrotikUser.aggregate([
    {
      $group: {
        _id: '$package',
        userCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'packages',
        localField: '_id',
        foreignField: '_id',
        as: 'packageDetails',
      },
    },
    {
        $unwind: {
            path: '$packageDetails',
            preserveNullAndEmptyArrays: true // Keep users even if package is deleted
        }
    },
    {
      $project: {
        _id: 0,
        packageName: { $ifNull: ['$packageDetails.name', 'Unknown Package'] },
        userCount: 1,
      },
    },
  ]);
  res.json(usersByPackage);
});

module.exports = {
  getDashboardStats,
  getSuperAdminDashboardStats,
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
  getRoutersPerTenant,
  getUsersByPackage,
};