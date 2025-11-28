const express = require('express');
const router = express.Router();
const { searchEntities } = require('../controllers/searchController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

// @desc    Search for users and devices
// @route   GET /api/search
// @access  Admin
router.route('/').get(protect, isSuperAdminOrAdmin, searchEntities);

module.exports = router;
