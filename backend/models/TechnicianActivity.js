const mongoose = require('mongoose');

const TechnicianActivitySchema = mongoose.Schema(
  {
    tenantOwner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    technician: {
      type: String,
      required: true,
    },
    activityType: {
      type: String,
      enum: ['Installation', 'Support'],
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      required: true,
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Please add a valid phone number'],
    },
    activityDate: {
      type: Date,
      required: true,
    },
    description: { // General description of the activity
      type: String,
      required: true,
    },
    // Fields specific to Installation
    installedEquipment: { // e.g., "Router X, ONU Y"
      type: String,
      required: function() { return this.activityType === 'Installation'; }
    },
    installationNotes: {
      type: String,
      required: function() { return this.activityType === 'Installation'; }
    },
    // Fields specific to Support
    supportCategory: { // ADDED FIELD
      type: String,
      enum: ['Client Problem'],
      required: function() { return this.activityType === 'Support'; }
    },
    issueDescription: { // What was the client's reported issue?
      type: String,
      required: function() { return this.activityType === 'Support'; }
    },
    solutionProvided: { // What was done to resolve the issue?
      type: String,
      required: function() { return this.activityType === 'Support'; }
    },
    partsReplaced: { // e.g., "Faulty PSU, Cable"
      type: String,
    },
    configurationChanges: { // e.g., "Changed Wi-Fi password, updated router firmware"
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TechnicianActivity', TechnicianActivitySchema);