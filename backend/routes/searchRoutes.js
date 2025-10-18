const express = require('express');
const router = express.Router();
const { searchEntities } = require('../controllers/searchController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

// @desc    Search for users and devices
// @route   GET /api/search
// @access  Admin
router.route('/').get(protect, isAdminTenant, searchEntities);

module.exports = router;
