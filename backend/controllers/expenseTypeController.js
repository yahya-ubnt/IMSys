const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const ExpenseType = require('../models/ExpenseType');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Create a new expense type
// @route   POST /api/expensetypes
// @access  Private
const createExpenseType = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;

  const expenseTypeExists = await ExpenseType.findOne({ name, tenantOwner: req.user.tenantOwner });

  if (expenseTypeExists) {
    res.status(400);
    throw new Error('Expense type with this name already exists');
  }

  const expenseType = await ExpenseType.create({
    name,
    description: sanitizeString(description), // Sanitize description
    tenantOwner: req.user.tenantOwner,
  });

  res.status(201).json(expenseType);
});

// @desc    Get all expense types
// @route   GET /api/expensetypes
// @access  Private
const getExpenseTypes = asyncHandler(async (req, res) => {
  const expenseTypes = await ExpenseType.find({ tenantOwner: req.user.tenantOwner }).populate('tenantOwner', 'name email');
  res.status(200).json(expenseTypes);
});

// @desc    Get a single expense type by ID
// @route   GET /api/expensetypes/:id
// @access  Private
const getExpenseTypeById = asyncHandler(async (req, res) => {
  const expenseType = await ExpenseType.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner }).populate('tenantOwner', 'name email');

  if (!expenseType) {
    res.status(404);
    throw new Error('Expense type not found');
  }

  res.status(200).json(expenseType);
});

// @desc    Update an expense type
// @route   PUT /api/expensetypes/:id
// @access  Private
const updateExpenseType = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  let expenseType = await ExpenseType.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!expenseType) {
    res.status(404);
    throw new Error('Expense type not found');
  }

  expenseType.name = name || expenseType.name;
  expenseType.description = description ? sanitizeString(description) : expenseType.description;
  expenseType.status = status || expenseType.status;

  const updatedExpenseType = await expenseType.save();

  res.status(200).json(updatedExpenseType);
});

// @desc    Delete an expense type
// @route   DELETE /api/expensetypes/:id
// @access  Private
const deleteExpenseType = asyncHandler(async (req, res) => {
  const expenseType = await ExpenseType.findOne({ _id: req.params.id, tenantOwner: req.user.tenantOwner });

  if (!expenseType) {
    res.status(404);
    throw new Error('Expense type not found');
  }

  await expenseType.deleteOne();

  res.status(200).json({ message: 'Expense type removed' });
});

module.exports = {
  createExpenseType,
  getExpenseTypes,
  getExpenseTypeById,
  updateExpenseType,
  deleteExpenseType,
};
