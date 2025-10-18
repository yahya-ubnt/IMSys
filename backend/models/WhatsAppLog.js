const mongoose = require('mongoose');

const whatsAppLogSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
  },
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppTemplate',
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Queued', 'Sent', 'Failed', 'Delivered', 'Read'],
    default: 'Pending',
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed,
  },
  tenantOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // To store the actual values used to populate the template
  variablesUsed: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

const WhatsAppLog = mongoose.model('WhatsAppLog', whatsAppLogSchema);

module.exports = WhatsAppLog;