const mongoose = require('mongoose');

const BillSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Number, required: true, min: 1, max: 31 }, // Day of the month
    category: { type: String, required: true, enum: ['Personal', 'Company'] },
    status: { type: String, required: true, enum: ['Paid', 'Not Paid'], default: 'Not Paid' },
    paymentDate: { type: Date },
    method: { type: String, enum: ['M-Pesa', 'Bank', 'Cash'] },
    transactionMessage: { type: String },
    description: { type: String },
    month: { type: Number, required: true, min: 1, max: 12 }, // Month (1-12)
    year: { type: Number, required: true },
    tenantOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user who owns the bill
  },
  {
    timestamps: true,
  }
);

// Add a unique compound index to prevent duplicate bills for the same user, name, category, month, and year
BillSchema.index({ tenantOwner: 1, name: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Bill', BillSchema);