const express = require('express');
const router = express.Router({ mergeParams: true });
const { param } = require('express-validator');
const { runDiagnostic, getDiagnosticHistory } = require('../controllers/diagnosticController.js');
const { protect } = require('../middlewares/protect.js');

const userIdValidation = [param('userId', 'User ID is required and must be a valid Mongo ID').isMongoId()];

router.route('/')
  .post(protect, userIdValidation, runDiagnostic)
  .get(protect, userIdValidation, getDiagnosticHistory);

module.exports = router;