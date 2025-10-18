const asyncHandler = require('express-async-handler');
const MikrotikUser = require('../models/MikrotikUser');
const Device = require('../models/Device');

// @desc    Search for users and devices
// @route   GET /api/search?q=...
// @access  Admin
const searchEntities = asyncHandler(async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  const searchQuery = { $regex: query, $options: 'i' };

  let userQuery = { $or: [{ username: searchQuery }, { officialName: searchQuery }] };
  let deviceQuery = { deviceName: searchQuery };

  if (!req.user.roles.includes('SUPER_ADMIN')) {
    userQuery.tenantOwner = req.user.tenantOwner;
    deviceQuery.tenantOwner = req.user.tenantOwner;
  }

  // Perform searches in parallel
  const [users, devices] = await Promise.all([
    MikrotikUser.find(userQuery).select('officialName username station').limit(10),
    Device.find(deviceQuery).select('deviceName deviceType').limit(10),
  ]);

  // Format the results with a type identifier
  const formattedUsers = users.map(user => ({
    _id: user._id,
    name: `${user.officialName} (${user.username})`,
    type: 'User',
    entity: user, // Include the full user object for the frontend
  }));

  const formattedDevices = devices.map(device => ({
    _id: device._id,
    name: `${device.deviceName} (${device.deviceType})`,
    type: device.deviceType, // 'Access' or 'Station'
    entity: device,
  }));

  const combinedResults = [...formattedUsers, ...formattedDevices];

  res.json(combinedResults);
});

module.exports = {
  searchEntities,
};
