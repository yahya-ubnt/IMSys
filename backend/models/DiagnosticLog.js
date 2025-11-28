const mongoose = require('mongoose');

const diagnosticLogSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
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
    
    diagnosticLogSchema.index({ tenant: 1 });
    
    const DiagnosticLog = mongoose.model('DiagnosticLog', diagnosticLogSchema);
    
    module.exports = DiagnosticLog;
    