const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
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

expenseSchema.index({ tenant: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
