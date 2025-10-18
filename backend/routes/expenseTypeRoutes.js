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
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware');

router.route('/').post(
  [protect, isSuperAdminOrAdminTenant],
  [
    body('name', 'Name is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
    body('status', 'Invalid status').optional().isIn(['Active', 'Inactive']),
  ],
  createExpenseType
).get(protect, isSuperAdminOrAdminTenant, getExpenseTypes);
router
  .route('/:id')
  .get(protect, isSuperAdminOrAdminTenant, getExpenseTypeById)
  .put(protect, isSuperAdminOrAdminTenant, updateExpenseType)
  .delete(protect, isSuperAdminOrAdminTenant, deleteExpenseType);

module.exports = router;
