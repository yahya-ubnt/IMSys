const express = require('express');
const router = express.Router();
const {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
} = require('../controllers/billController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createBill).get(protect, getBills);
router
  .route('/:id')
  .get(protect, getBillById)
  .put(protect, updateBill)
  .delete(protect, deleteBill);

module.exports = router;