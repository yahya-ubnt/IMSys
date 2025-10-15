const mongoose = require('mongoose');

const stkRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkoutRequestId: {
    type: String,
    required: true,
    unique: true,
  },
  accountReference: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '5m', // Automatically delete after 5 minutes
  },
});

module.exports = mongoose.model('StkRequest', stkRequestSchema);
