
const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middlewares/protect');

const router = express.Router();

router.route('/').post(protect, uploadImage);

module.exports = router;
