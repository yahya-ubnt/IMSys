const HotspotUser = require('../models/HotspotUser');
const MikrotikRouter = require('../models/MikrotikRouter');
const mikrotikSyncQueue = require('../queues/mikrotikSyncQueue');

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
      hotspotPackage,
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

    const user = new HotspotUser({
      officialName,
      email,
      location,
      hotspotName,
      hotspotPassword,
      package: hotspotPackage,
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
      syncStatus: 'pending',
    });

    const createdUser = await user.save();

    // Queue the sync job
    await mikrotikSyncQueue.add('syncHotspotUser', {
      mikrotikUserId: createdUser._id,
      tenantId: req.user.tenant,
    });

    res.status(201).json(createdUser);
  } catch (error) {
    console.error('Error creating hotspot user:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all hotspot users
// @route   GET /api/hotspot/users
// @access  Private/Admin
exports.getHotspotUsers = async (req, res) => {
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
      const updateData = req.body;
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          user[key] = updateData[key];
        }
      });

      user.syncStatus = 'pending';
      const updatedUser = await user.save();

      // Queue the sync job
      await mikrotikSyncQueue.add('syncHotspotUser', {
        mikrotikUserId: updatedUser._id,
        tenantId: req.user.tenant,
      });

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
    const user = await HotspotUser.findById(req.params.id);

    if (user && user.tenant.toString() === req.user.tenant.toString()) {
      // Mark as pending removal
      user.syncStatus = 'pending';
      await user.save();

      // Add removal job to queue
      // We pass necessary details in case DB record is deleted before worker runs
      await mikrotikSyncQueue.add('removeHotspotUser', {
        mikrotikUserId: user._id,
        username: user.hotspotName,
        routerId: user.mikrotikRouter,
        tenantId: req.user.tenant,
      });

      // For hotspot users, we might want to keep the record for a few seconds or delete now
      // Here we delete from DB after queueing, but the worker will handle router cleanup
      await user.deleteOne();
      
      res.json({ message: 'User removal queued' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
