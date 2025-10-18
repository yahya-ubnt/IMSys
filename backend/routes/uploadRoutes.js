const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect, isAdminTenant } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, isAdminTenant, uploadImage);

module.exports = router;
