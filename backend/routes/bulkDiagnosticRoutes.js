const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { runBulkDiagnostic } = require('../controllers/bulkDiagnosticController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @desc    Run a bulk diagnostic check on a device (AP or Station)
// @route   POST /api/bulk-diagnostics
// @access  Admin
router.route('/').post(
  protect,
  admin,
  [
    body('deviceId', 'Device ID is required and must be a valid Mongo ID').isMongoId(),
    body('userId', 'User ID must be a valid Mongo ID').optional().isMongoId(),
  ],
  runBulkDiagnostic
);

module.exports = router;
