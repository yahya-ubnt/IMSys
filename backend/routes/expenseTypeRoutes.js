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
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').post(
  isSuperAdminOrAdmin,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('description', 'Description must be a string').optional().isString(),
  ],
  createExpenseType
).get(isSuperAdminOrAdmin, getExpenseTypes);

router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getExpenseTypeById)
  .put(isSuperAdminOrAdmin, updateExpenseType)
  .delete(isSuperAdminOrAdmin, deleteExpenseType);

module.exports = router;
