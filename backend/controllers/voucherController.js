const Voucher = require('../models/Voucher');
const MikrotikRouter = require('../models/MikrotikRouter');
const { addHotspotUser, removeHotspotUser } = require('../utils/mikrotikUtils');
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
