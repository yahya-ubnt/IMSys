const express = require('express');
const router = express.Router();
const {
  generateVouchers,
  getVouchers,
  deleteVoucherBatch,
  loginVoucher,
} = require('../controllers/voucherController');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.post('/login', loginVoucher); // Public route for voucher login

router
  .route('/')
  .post(protect, isSuperAdminOrAdminTenant, generateVouchers)
  .get(protect, isSuperAdminOrAdminTenant, getVouchers);

router
  .route('/batch/:batchId')
  .delete(protect, isSuperAdminOrAdminTenant, deleteVoucherBatch);

module.exports = router;

