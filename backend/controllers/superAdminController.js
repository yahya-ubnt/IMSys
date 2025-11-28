const asyncHandler = require('express-async-handler');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const MikrotikUser = require('../models/MikrotikUser');
const Transaction = require('../models/Transaction');
const MikrotikRouter = require('../models/MikrotikRouter');
const Package = require('../models/Package');

// @desc    Get SUPER_ADMIN dashboard stats
// @route   GET /api/superadmin/dashboard-stats
// @access  Private/SuperAdmin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalTenants = await Tenant.countDocuments({});
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
  const totalTenants = await Tenant.countDocuments({});
  const activeTenants = await Tenant.countDocuments({ status: 'active' });
  const totalRouters = await MikrotikRouter.countDocuments({});
  const totalUsers = await MikrotikUser.countDocuments({});

  res.json({
    totalTenants,
    activeTenants,
    totalRouters,
    totalUsers,
  });
});

// @desc    Get router count per tenant
// @route   GET /api/super-admin/dashboard/routers-per-tenant
// @access  Private/SuperAdmin
const getRoutersPerTenant = asyncHandler(async (req, res) => {
  const routersPerTenant = await MikrotikRouter.aggregate([
    {
      $group: {
        _id: '$tenant', // Group by the new 'tenant' field
        routerCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'tenants', // Lookup the new 'tenants' collection
        localField: '_id',
        foreignField: '_id',
        as: 'tenantDetails',
      },
    },
    {
      $unwind: {
        path: '$tenantDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        tenantName: { $ifNull: ['$tenantDetails.name', 'Unknown Tenant'] },
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
        preserveNullAndEmptyArrays: true,
      },
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
  getRoutersPerTenant,
  getUsersByPackage,
};