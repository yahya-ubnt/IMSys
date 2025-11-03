const Voucher = require('../models/Voucher');
const crypto = require('crypto');

// Function to generate a random string
const generateRandomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, length);   // return required number of characters
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

    const tenantId = req.user.tenantOwner || req.user._id;
    const batchId = crypto.randomBytes(8).toString('hex');
    const createdVouchers = [];

    for (let i = 0; i < quantity; i++) {
      const username = generateRandomString(nameLength);
      const password = withPassword ? generateRandomString(6) : null;

      const voucher = new Voucher({
        username,
        password,
        profile,
        price,
        tenant: tenantId,
        mikrotikRouter,
        batch: batchId,
      });

      // TODO: Add voucher to Mikrotik router via API

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
    const vouchers = await Voucher.find({ tenant: req.user.tenantOwner || req.user._id });
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

    const vouchers = await Voucher.find({ batch: batchId, tenant: tenantId });

    if (!vouchers.length) {
      return res.status(404).json({ message: 'No vouchers found for this batch and tenant' });
    }

    // TODO: Delete vouchers from Mikrotik router via API

    await Voucher.deleteMany({ batch: batchId, tenant: tenantId });

    res.json({ message: `Batch ${batchId} removed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
