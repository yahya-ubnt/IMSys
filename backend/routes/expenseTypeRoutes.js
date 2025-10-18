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
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post(
  [protect, isAdminTenant],
  [
    body('name', 'Name is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createExpenseType
).get(protect, isAdminTenant, getExpenseTypes);
router
  .route('/:id')
  .get(protect, isAdminTenant, getExpenseTypeById)
  .put(protect, isAdminTenant, updateExpenseType)
  .delete(protect, isAdminTenant, deleteExpenseType);

module.exports = router;
