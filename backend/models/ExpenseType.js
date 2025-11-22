const mongoose = require('mongoose');

const expenseTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseType = mongoose.model('ExpenseType', expenseTypeSchema);
module.exports = ExpenseType;
