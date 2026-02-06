const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect, isAdmin } = require('../middlewares/protect');

const router = express.Router();

router.route('/').post(protect, isAdmin, uploadImage);

module.exports = router;
