const mongoose = require('mongoose');

const diagnosticLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    mikrotikUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'MikrotikUser',
    },
    router: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MikrotikRouter',
    },
    cpeDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
    },
    steps: [
      {
        stepName: String,
        status: String, // 'Success', 'Failure', 'Warning'
        summary: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
    finalConclusion: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const DiagnosticLog = mongoose.model('DiagnosticLog', diagnosticLogSchema);

module.exports = DiagnosticLog;