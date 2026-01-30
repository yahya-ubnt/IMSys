const express = require('express');
const router = express.Router();
const {
  generateVouchers,
  getVouchers,
  deleteVoucherBatch,
  loginVoucher,
} = require('../controllers/voucherController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.post('/login', loginVoucher); // Public route for voucher login

router
  .route('/')
  .post(protect, isSuperAdminOrAdmin, generateVouchers)
  .get(protect, isSuperAdminOrAdmin, getVouchers);

router
  .route('/batch/:batchId')
  .delete(protect, isSuperAdminOrAdmin, deleteVoucherBatch);

module.exports = router;

