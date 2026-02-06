const express = require('express');
const router = express.Router();
const { searchEntities } = require('../controllers/searchController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');


// @desc    Search for entities (Mikrotik users, vouchers, etc.)
// @route   GET /api/search?q=...&type=...
// @access  Private
router.route('/').get(protect, isSuperAdminOrAdmin, searchEntities);

module.exports = router;
