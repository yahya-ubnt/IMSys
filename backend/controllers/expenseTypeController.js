const asyncHandler = require('express-async-handler');
const ExpenseType = require('../models/ExpenseType');

// @desc    Create a new expense type
// @route   POST /api/expensetypes
// @access  Private
const createExpenseType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please add a name for the expense type');
  }

  const expenseTypeExists = await ExpenseType.findOne({ name });

  if (expenseTypeExists) {
    res.status(400);
    throw new Error('Expense type with this name already exists');
  }

  const expenseType = await ExpenseType.create({
    name,
    description,
    addedBy: req.user._id,
  });

  res.status(201).json(expenseType);
});

// @desc    Get all expense types
// @route   GET /api/expensetypes
// @access  Private
const getExpenseTypes = asyncHandler(async (req, res) => {
  const expenseTypes = await ExpenseType.find({ addedBy: req.user._id }).populate('addedBy', 'name email');
  res.status(200).json(expenseTypes);
});

// @desc    Get a single expense type by ID
// @route   GET /api/expensetypes/:id
// @access  Private
const getExpenseTypeById = asyncHandler(async (req, res) => {
  const expenseType = await ExpenseType.findById(req.params.id).populate('addedBy', 'name email');

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

  let expenseType = await ExpenseType.findById(req.params.id);

  if (!expenseType) {
    res.status(404);
    throw new Error('Expense type not found');
  }

  // Optional: Check if user is authorized to update (e.g., admin)
  // This depends on your app's authorization logic

  expenseType.name = name || expenseType.name;
  expenseType.description = description || expenseType.description;
  expenseType.status = status || expenseType.status;

  const updatedExpenseType = await expenseType.save();

  res.status(200).json(updatedExpenseType);
});

// @desc    Delete an expense type
// @route   DELETE /api/expensetypes/:id
// @access  Private
const deleteExpenseType = asyncHandler(async (req, res) => {
  const expenseType = await ExpenseType.findById(req.params.id);

  if (!expenseType) {
    res.status(404);
    throw new Error('Expense type not found');
  }

  // Optional: Check if user is authorized to delete

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
