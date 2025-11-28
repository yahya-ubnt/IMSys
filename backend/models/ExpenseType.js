const mongoose = require('mongoose');

const expenseTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
  },
  {
    timestamps: true,
  }
);

expenseTypeSchema.index({ tenant: 1 });
expenseTypeSchema.index({ tenant: 1, name: 1 }, { unique: true });

const ExpenseType = mongoose.model('ExpenseType', expenseTypeSchema);
module.exports = ExpenseType;
