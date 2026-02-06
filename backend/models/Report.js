const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['FINANCIAL', 'USAGE', 'SYSTEM'],
  },
  data: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
