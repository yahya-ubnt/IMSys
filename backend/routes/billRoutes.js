const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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
  .put(
    protect,
    [
      body('name', 'Name is required').optional().not().isEmpty(),
      body('amount', 'Amount must be a number').optional().isNumeric(),
      body('dueDate', 'Due date must be a number between 1 and 31').optional().isInt({ min: 1, max: 31 }),
      body('category', 'Invalid category').optional().isIn(['Personal', 'Company']),
      body('status', 'Invalid status').optional().isIn(['Paid', 'Not Paid']),
      body('method', 'Payment method is required when status is Paid').if(body('status').equals('Paid')).not().isEmpty().isIn(['M-Pesa', 'Bank', 'Cash']),
      body('paymentDate', 'Payment date must be a valid date').optional().isISO8601().toDate(),
      body('transactionMessage', 'Transaction message must be a string').optional().isString(),
      body('description', 'Description must be a string').optional().isString(),
    ],
    updateBill
  )
  .delete(protect, deleteBill);

module.exports = router;