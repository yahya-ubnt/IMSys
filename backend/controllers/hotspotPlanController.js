const HotspotPlan = require('../models/HotspotPlan');

// @desc    Create a hotspot plan
// @route   POST /api/hotspot/plans
// @access  Private/Admin
exports.createHotspotPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      mikrotikRouter,
      timeLimitValue,
      timeLimitUnit,
      server,
      profile,
      rateLimit,
      dataLimitValue,
      dataLimitUnit,
      sharedUsers,
      validDays,
      showInCaptivePortal,
    } = req.body;

    const plan = new HotspotPlan({
      name,
      price,
      tenant: req.user.tenantOwner || req.user._id,
      mikrotikRouter,
      timeLimitValue,
      timeLimitUnit,
      server,
      profile,
      rateLimit,
      dataLimitValue,
      dataLimitUnit,
      sharedUsers,
      validDays,
      showInCaptivePortal,
    });

    const createdPlan = await plan.save();
    res.status(201).json(createdPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all hotspot plans
// @route   GET /api/hotspot/plans
// @access  Private/Admin
exports.getHotspotPlans = async (req, res) => {
  try {
    const plans = await HotspotPlan.find({ tenant: req.user.tenantOwner || req.user._id });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single hotspot plan
// @route   GET /api/hotspot/plans/:id
// @access  Private/Admin
exports.getHotspotPlanById = async (req, res) => {
  try {
    const plan = await HotspotPlan.findById(req.params.id);

    if (plan && (plan.tenant.toString() === (req.user.tenantOwner?.toString() || req.user._id.toString()))) {
      res.json(plan);
    } else {
      res.status(404).json({ message: 'Plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a hotspot plan
// @route   PUT /api/hotspot/plans/:id
// @access  Private/Admin
exports.updateHotspotPlan = async (req, res) => {
  try {
    const plan = await HotspotPlan.findById(req.params.id);

    if (plan && (plan.tenant.toString() === (req.user.tenantOwner?.toString() || req.user._id.toString()))) {
      const {
        name,
        price,
        mikrotikRouter,
        timeLimitValue,
        timeLimitUnit,
        server,
        profile,
        rateLimit,
        dataLimitValue,
        dataLimitUnit,
        sharedUsers,
        validDays,
        showInCaptivePortal,
      } = req.body;

      plan.name = name || plan.name;
      plan.price = price || plan.price;
      plan.mikrotikRouter = mikrotikRouter || plan.mikrotikRouter;
      plan.timeLimitValue = timeLimitValue || plan.timeLimitValue;
      plan.timeLimitUnit = timeLimitUnit || plan.timeLimitUnit;
      plan.server = server || plan.server;
      plan.profile = profile || plan.profile;
      plan.rateLimit = rateLimit || plan.rateLimit;
      plan.dataLimitValue = dataLimitValue || plan.dataLimitValue;
      plan.dataLimitUnit = dataLimitUnit || plan.dataLimitUnit;
      plan.sharedUsers = sharedUsers || plan.sharedUsers;
      plan.validDays = validDays || plan.validDays;
      plan.showInCaptivePortal = showInCaptivePortal !== undefined ? showInCaptivePortal : plan.showInCaptivePortal;

      const updatedPlan = await plan.save();
      res.json(updatedPlan);
    } else {
      res.status(404).json({ message: 'Plan not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a hotspot plan
// @route   DELETE /api/hotspot/plans/:id
// @access  Private/Admin
exports.deleteHotspotPlan = async (req, res) => {
  try {
    const plan = await HotspotPlan.findById(req.params.id);

    if (plan && (plan.tenant.toString() === (req.user.tenantOwner?.toString() || req.user._id.toString()))) {
      await plan.remove();
      res.json({ message: 'Plan removed' });
    } else {
      res.status(404).json({ message: 'Plan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
