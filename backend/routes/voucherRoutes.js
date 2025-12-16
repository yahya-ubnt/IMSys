const express = require('express');
const router = express.Router();
const {
  generateVouchers,
  getVouchers,
  deleteVoucherBatch,
  loginVoucher,
} = require('../controllers/voucherController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.post('/login', loginVoucher); // Public route for voucher login

router
  .route('/')
  .post(isSuperAdminOrAdmin, generateVouchers)
  .get(isSuperAdminOrAdmin, getVouchers);

router
  .route('/batch/:batchId')
  .delete(isSuperAdminOrAdmin, deleteVoucherBatch);

module.exports = router;

