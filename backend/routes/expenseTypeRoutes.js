const express = require('express');
const router = express.Router();
const {
  createExpenseType,
  getExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
} = require('../controllers/expenseTypeController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createExpenseType).get(protect, getExpenseTypes);
router
  .route('/:id')
  .get(protect, getExpenseTypeById)
  .put(protect, updateExpenseType)
  .delete(protect, deleteExpenseType);

module.exports = router;
