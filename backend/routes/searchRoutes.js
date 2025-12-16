const express = require('express');
const router = express.Router();
const { searchEntities } = require('../controllers/searchController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');


// @desc    Search for entities (Mikrotik users, vouchers, etc.)
// @route   GET /api/search?q=...&type=...
// @access  Private
router.route('/').get(isSuperAdminOrAdmin, searchEntities);

module.exports = router;
