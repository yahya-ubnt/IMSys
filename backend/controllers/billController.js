const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Bill = require('../models/Bill');
const { sanitizeString } = require('../utils/sanitization'); // Import sanitizeString

// @desc    Create a new bill
// @route   POST /api/bills
// @access  Private
const createBill = asyncHandler(async (req, res) => {
  const { name, amount, dueDate, category, description } = req.body;

  if (!name || !amount || !dueDate || !category) {
    res.status(400);
    throw new Error('Please add all required fields: name, amount, dueDate, category');
  }

  const user = req.user._id;
  const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
  const currentYear = new Date().getFullYear();

  // Check if a bill with the same name and category already exists for the current month and user
  const existingBill = await Bill.findOne({
    user,
    name,
    category,
    month: currentMonth,
    year: currentYear,
  });

  if (existingBill) {
    res.status(400);
    throw new Error('A bill with this name and category already exists for the current month.');
  }

  const bill = await Bill.create({
    name,
    amount,
    dueDate,
    category,
    description: sanitizeString(description), // Sanitize description
    user,
    month: currentMonth,
    year: currentYear,
    status: 'Not Paid', // Default status
  });

  res.status(201).json(bill);
});

// @desc    Get all bills for a specific month/year or current
// @route   GET /api/bills
// @access  Private
const getBills = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const queryMonth = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
  const queryYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

  const bills = await Bill.find({ user, month: queryMonth, year: queryYear }).sort({ dueDate: 1 });

  res.status(200).json(bills);
});

// @desc    Get a single bill by ID
// @route   GET /api/bills/:id
// @access  Private
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).lean();

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Make sure the logged in user owns the bill
  if (bill.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to view this bill');
  }

  res.status(200).json(bill);
});

// @desc    Update a bill
// @route   PUT /api/bills/:id
// @access  Private
const updateBill = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, amount, dueDate, status, paymentDate, method, transactionMessage, description } = req.body;

  let bill = await Bill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Make sure the logged in user owns the bill
  if (bill.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to update this bill');
  }

  // Update fields
  bill.name = name || bill.name; // ADDED
  bill.amount = amount || bill.amount; // ADDED
  bill.dueDate = dueDate || bill.dueDate; // ADDED
  bill.status = status || bill.status;
  bill.description = description ? sanitizeString(description) : bill.description;

  if (bill.status === 'Paid') {
    bill.paymentDate = paymentDate || new Date(); // Set to current date if not provided
    bill.method = method || bill.method; // Method is required if status is Paid
    bill.transactionMessage = transactionMessage ? sanitizeString(transactionMessage) : bill.transactionMessage;

    if (!bill.method) {
      res.status(400);
      throw new Error('Payment method is required when marking bill as Paid');
    }
  } else if (bill.status === 'Not Paid') {
    // Clear payment details if status is set back to Not Paid
    bill.paymentDate = undefined;
    bill.method = undefined;
    bill.transactionMessage = undefined;
  }

  const updatedBill = await bill.save();

  res.status(200).json(updatedBill);
});

// @desc    Delete a bill
// @route   DELETE /api/bills/:id
// @access  Private
const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  // Make sure the logged in user owns the bill
  if (bill.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this bill');
  }

  await bill.deleteOne();

  res.status(200).json({ message: 'Bill removed' });
});

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
};