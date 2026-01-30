const express = require('express');
const router = express.Router({ mergeParams: true });
const { param } = require('express-validator');
const { runDiagnostic, getDiagnosticHistory, getDiagnosticLogById } = require('../controllers/diagnosticController.js');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect.js');

const userIdValidation = [param('userId', 'User ID is required and must be a valid Mongo ID').isMongoId()];
const logIdValidation = [param('logId', 'Log ID is required and must be a valid Mongo ID').isMongoId()];

router.route('/')
  .post(protect, isSuperAdminOrAdmin, userIdValidation, runDiagnostic)
  .get(protect, isSuperAdminOrAdmin, userIdValidation, getDiagnosticHistory);

router.route('/:logId')
    .get(protect, isSuperAdminOrAdmin, userIdValidation, logIdValidation, getDiagnosticLogById);

module.exports = router;