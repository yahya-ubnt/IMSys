const express = require('express');
const router = express.Router();
const { runBulkDiagnostic } = require('../controllers/bulkDiagnosticController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @desc    Run a bulk diagnostic check on a device (AP or Station)
// @route   POST /api/bulk-diagnostics
// @access  Admin
router.route('/').post(protect, admin, runBulkDiagnostic);

module.exports = router;
