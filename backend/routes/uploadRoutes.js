const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(isAdmin, uploadImage);

module.exports = router;
