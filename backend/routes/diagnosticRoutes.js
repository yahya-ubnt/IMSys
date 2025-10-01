const express = require('express');
const router = express.Router({ mergeParams: true });
const { runDiagnostic, getDiagnosticHistory } = require('../controllers/diagnosticController.js');
const { protect } = require('../middlewares/protect.js');

router.route('/')
  .post(protect, runDiagnostic)
  .get(protect, getDiagnosticHistory);

module.exports = router;