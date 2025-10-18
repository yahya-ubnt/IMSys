const express = require('express');
const router = express.Router({ mergeParams: true });
const { param } = require('express-validator');
const { runDiagnostic, getDiagnosticHistory, getDiagnosticLogById } = require('../controllers/diagnosticController.js');
const { protect, isSuperAdminOrAdminTenant } = require('../middlewares/authMiddleware.js');

const userIdValidation = [param('userId', 'User ID is required and must be a valid Mongo ID').isMongoId()];
const logIdValidation = [param('logId', 'Log ID is required and must be a valid Mongo ID').isMongoId()];

router.route('/')
  .post([protect, isSuperAdminOrAdminTenant], userIdValidation, runDiagnostic)
  .get([protect, isSuperAdminOrAdminTenant], userIdValidation, getDiagnosticHistory);

router.route('/:logId')
    .get([protect, isSuperAdminOrAdminTenant], userIdValidation, logIdValidation, getDiagnosticLogById);

module.exports = router;