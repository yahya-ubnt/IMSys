const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExpenseType,
  getExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
} = require('../controllers/expenseTypeController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(
  protect,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createExpenseType
).get(protect, getExpenseTypes);
router
  .route('/:id')
  .get(protect, getExpenseTypeById)
  .put(protect, updateExpenseType)
  .delete(protect, deleteExpenseType);

module.exports = router;
