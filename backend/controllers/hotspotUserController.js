const HotspotUser = require('../models/HotspotUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const { addHotspotUser, removeHotspotUser } = require('../utils/mikrotikUtils');

// @desc    Create a hotspot user
// @route   POST /api/hotspot/users
// @access  Private/Admin
exports.createHotspotUser = async (req, res) => {
  try {
    const {
      officialName,
      email,
      location,
      hotspotName,
      hotspotPassword,
      package,
      server,
      profile,
      referenceNumber,
      billAmount,
      installationFee,
      billingCycleValue,
      billingCycleUnit,
      phoneNumber,
      expiryDate,
      expiryTime,
      mikrotikRouter,
    } = req.body;

    const router = await MikrotikRouter.findOne({ _id: mikrotikRouter, tenant: req.user.tenant });
    if (!router) {
      return res.status(404).json({ message: 'Mikrotik router not found' });
    }

    const userData = {
      username: hotspotName,
      password: hotspotPassword,
      server,
      profile,
      timeLimit: '0', // Assuming no time limit for recurring users, can be adjusted
      dataLimit: '0', // Assuming no data limit for recurring users, can be adjusted
    };

    const success = await addHotspotUser(router, userData);

    if (!success) {
      return res.status(500).json({ message: 'Failed to create hotspot user on Mikrotik router' });
    }

    const user = new HotspotUser({
      officialName,
      email,
      location,
      hotspotName,
      hotspotPassword,
      package,
      server,
      profile,
      referenceNumber,
      billAmount,
      installationFee,
      billingCycleValue,
      billingCycleUnit,
      phoneNumber,
      expiryDate,
      expiryTime,
      tenant: req.user.tenant,
      mikrotikRouter,
    });

    const createdUser = await user.save();
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all hotspot users
// @route   GET /api/hotspot/users
// @access  Private/Admin
exports.getHotspotUsers = async (req, res) => {
  console.log("Fetching hotspot users...");
  try {
    const users = await HotspotUser.find({ tenant: req.user.tenant }).populate('mikrotikRouter', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single hotspot user
// @route   GET /api/hotspot/users/:id
// @access  Private/Admin
exports.getHotspotUserById = async (req, res) => {
  try {
    const user = await HotspotUser.findById(req.params.id);

    if (user && user.tenant.toString() === req.user.tenant.toString()) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a hotspot user
// @route   PUT /api/hotspot/users/:id
// @access  Private/Admin
exports.updateHotspotUser = async (req, res) => {
  try {
    const user = await HotspotUser.findById(req.params.id);

    if (user && user.tenant.toString() === req.user.tenant.toString()) {
      const {
        officialName,
        email,
        location,
        hotspotName,
        hotspotPassword,
        package,
        server,
        profile,
        referenceNumber,
        billAmount,
        installationFee,
        billingCycleValue,
        billingCycleUnit,
        phoneNumber,
        expiryDate,
        expiryTime,
        mikrotikRouter,
      } = req.body;

      user.officialName = officialName || user.officialName;
      user.email = email || user.email;
      user.location = location || user.location;
      user.hotspotName = hotspotName || user.hotspotName;
      user.hotspotPassword = hotspotPassword || user.hotspotPassword;
      user.package = package || user.package;
      user.server = server || user.server;
      user.profile = profile || user.profile;
      user.referenceNumber = referenceNumber || user.referenceNumber;
      user.billAmount = billAmount || user.billAmount;
      user.installationFee = installationFee || user.installationFee;
      user.billingCycleValue = billingCycleValue || user.billingCycleValue;
      user.billingCycleUnit = billingCycleUnit || user.billingCycleUnit;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.expiryDate = expiryDate || user.expiryDate;
      user.expiryTime = expiryTime || user.expiryTime;
      user.mikrotikRouter = mikrotikRouter || user.mikrotikRouter;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a hotspot user
// @route   DELETE /api/hotspot/users/:id
// @access  Private/Admin
exports.deleteHotspotUser = async (req, res) => {
  try {
    const user = await HotspotUser.findById(req.params.id).populate('mikrotikRouter');

    if (user && user.tenant.toString() === req.user.tenant.toString()) {
      const router = user.mikrotikRouter;
      if (router) {
        await removeHotspotUser(router, user.hotspotName);
      }

      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
