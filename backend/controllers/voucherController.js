const Voucher = require('../models/Voucher');
const MikrotikRouter = require('../models/MikrotikRouter');
const HotspotSession = require('../models/HotspotSession');
const HotspotPlan = require('../models/HotspotPlan');
const { addHotspotUser, removeHotspotUser, addHotspotIpBinding } = require('../utils/mikrotikUtils');
const crypto = require('crypto');

// Function to generate a random string of numbers
const generateRandomString = (length) => {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// @desc    Generate a new batch of cash vouchers
// @route   POST /api/hotspot/vouchers
// @access  Private/Admin
exports.generateVouchers = async (req, res) => {
  try {
    const {
      quantity,
      withPassword,
      server,
      profile,
      dataLimitValue,
      dataLimitUnit,
      timeLimitValue,
      timeLimitUnit,
      nameLength,
      price,
      mikrotikRouter,
    } = req.body;

    const router = await MikrotikRouter.findById(mikrotikRouter);
    if (!router) {
      return res.status(404).json({ message: 'Mikrotik router not found' });
    }

    const tenantId = req.user.tenantOwner || req.user._id;
    const batchId = crypto.randomBytes(8).toString('hex');
    const createdVouchers = [];

    // Determine expiry date based on plan's time limit
    let expiryDate = null;
    if (timeLimitValue && timeLimitUnit) {
      const now = new Date();
      switch (timeLimitUnit) {
        case 'minutes':
          expiryDate = new Date(now.getTime() + timeLimitValue * 60 * 1000);
          break;
        case 'hours':
          expiryDate = new Date(now.getTime() + timeLimitValue * 60 * 60 * 1000);
          break;
        case 'days':
          expiryDate = new Date(now.getTime() + timeLimitValue * 24 * 60 * 60 * 1000);
          break;
        // Default to hours if unit is not recognized
        default:
          expiryDate = new Date(now.getTime() + timeLimitValue * 60 * 60 * 1000);
      }
    }

    for (let i = 0; i < quantity; i++) {
      const username = generateRandomString(nameLength);
      const password = withPassword ? generateRandomString(6) : username;

      const timeLimit = `${timeLimitValue}${timeLimitUnit.charAt(0)}`;
      const dataLimit = dataLimitValue ? `${dataLimitValue}${dataLimitUnit}` : '0';

      const userData = {
        username,
        password,
        server,
        profile,
        timeLimit,
        dataLimit,
      };

      const success = await addHotspotUser(router, userData);

      if (!success) {
        // If one voucher fails, we stop and don't save any more.
        // Consider a transaction or rollback mechanism for more robustness.
        return res.status(500).json({ message: `Failed to create voucher ${i + 1} on Mikrotik router` });
      }

      const voucher = new Voucher({
        username,
        password,
        profile,
        price,
        tenant: tenantId,
        mikrotikRouter,
        batch: batchId,
        status: 'active',
        expiryDate: expiryDate,
      });

      const createdVoucher = await voucher.save();
      createdVouchers.push(createdVoucher);
    }

    res.status(201).json(createdVouchers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all generated vouchers
// @route   GET /api/hotspot/vouchers
// @access  Private/Admin
exports.getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ tenant: req.user.tenantOwner || req.user._id }).sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a batch of vouchers
// @route   DELETE /api/hotspot/vouchers/batch/:batchId
// @access  Private/Admin
exports.deleteVoucherBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const tenantId = req.user.tenantOwner || req.user._id;

    const vouchers = await Voucher.find({ batch: batchId, tenant: tenantId }).populate('mikrotikRouter');

    if (!vouchers.length) {
      return res.status(404).json({ message: 'No vouchers found for this batch and tenant' });
    }

    const router = vouchers[0].mikrotikRouter;

    for (const voucher of vouchers) {
      await removeHotspotUser(router, voucher.username);
    }

    await Voucher.deleteMany({ batch: batchId, tenant: tenantId });

    res.json({ message: `Batch ${batchId} removed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login with a voucher code
// @route   POST /api/hotspot/vouchers/login
// @access  Public
exports.loginVoucher = async (req, res) => {
  const { voucherCode, macAddress } = req.body;

  if (!voucherCode || !macAddress) {
    return res.status(400).json({ message: 'Voucher code and MAC address are required' });
  }

  try {
    const voucher = await Voucher.findOne({ username: voucherCode }).populate('mikrotikRouter');

    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    if (voucher.status !== 'active') {
      return res.status(400).json({ message: 'Voucher is not active or already used' });
    }

    if (voucher.expiryDate && new Date() > voucher.expiryDate) {
      voucher.status = 'expired';
      await voucher.save();
      return res.status(400).json({ message: 'Voucher has expired' });
    }

    const router = voucher.mikrotikRouter;
    if (!router) {
      return res.status(500).json({ message: 'Associated Mikrotik router not found' });
    }

    // Find the HotspotPlan associated with the voucher's profile
    const plan = await HotspotPlan.findOne({ profile: voucher.profile, mikrotikRouter: router._id });
    if (!plan) {
      return res.status(500).json({ message: 'Associated hotspot plan not found' });
    }

    // Bypass the user's MAC address on the Mikrotik router
    const bypassSuccess = await addHotspotIpBinding(router, macAddress, plan.server);
    if (!bypassSuccess) {
      return res.status(500).json({ message: 'Failed to bypass MAC address on Mikrotik' });
    }

    // Create a HotspotSession in our database
    const now = new Date();
    let endTime = voucher.expiryDate || new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000); // Fallback to plan time if no voucher expiry
    
    // If voucher has no explicit expiryDate, calculate from plan
    if (!voucher.expiryDate) {
      switch (plan.timeLimitUnit) {
        case 'minutes':
          endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 1000);
          break;
        case 'hours':
          endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000);
          break;
        case 'days':
          endTime = new Date(now.getTime() + plan.timeLimitValue * 24 * 60 * 60 * 1000);
          break;
        default:
          endTime = new Date(now.getTime() + plan.timeLimitValue * 60 * 60 * 1000); // Default to hours
      }
    }

    await HotspotSession.findOneAndUpdate(
      { macAddress: macAddress },
      {
        planId: plan._id,
        startTime: now,
        endTime: endTime,
        dataUsage: 0,
      },
      { upsert: true, new: true }
    );

    // Mark voucher as used
    voucher.status = 'used';
    voucher.usedByMacAddress = macAddress;
    await voucher.save();

    res.status(200).json({ message: 'Voucher login successful' });
  } catch (error) {
    console.error('Error during voucher login:', error);
    res.status(500).json({ message: error.message });
  }
};
