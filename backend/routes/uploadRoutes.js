const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, isAdmin, uploadImage);

module.exports = router;
