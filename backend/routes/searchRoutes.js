const express = require('express');
const router = express.Router();
const { searchEntities } = require('../controllers/searchController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @desc    Search for users and devices
// @route   GET /api/search
// @access  Admin
router.route('/').get(protect, admin, searchEntities);

module.exports = router;
