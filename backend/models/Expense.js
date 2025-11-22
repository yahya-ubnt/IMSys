const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    expenseType: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'ExpenseType',
    },
    expenseBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    description: {
      type: String,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
