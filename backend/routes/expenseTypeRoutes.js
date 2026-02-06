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
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/').post(
  protect,
  isSuperAdminOrAdmin,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
  ],
  createExpenseType
).get(protect, isSuperAdminOrAdmin, getExpenseTypes);

router
  .route('/:id')
  .get(protect, isSuperAdminOrAdmin, getExpenseTypeById)
  .put(protect, isSuperAdminOrAdmin, updateExpenseType)
  .delete(protect, isSuperAdminOrAdmin, deleteExpenseType);

module.exports = router;
