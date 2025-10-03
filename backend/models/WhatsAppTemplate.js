const mongoose = require('mongoose');

const whatsAppTemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: [true, 'A friendly template name is required.'],
    trim: true,
    unique: true,
  },
  providerTemplateId: {
    type: String,
    required: [true, 'The official Provider Template ID (e.g., Twilio Content SID) is required.'],
    trim: true,
    unique: true,
  },
  body: {
    type: String,
    required: [true, 'The template body is required.'],
    trim: true,
  },
  // A simple way to track variables, e.g., ['{{1}}', '{{2}}'] or ['{{customer_name}}']
  variables: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

const WhatsAppTemplate = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);

module.exports = WhatsAppTemplate;