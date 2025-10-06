const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const {
  getGeneralSettings,
  updateGeneralSettings,
  getMpesaSettings,
  updateMpesaSettings,
  activateMpesa,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.route('/general').get(protect, getGeneralSettings).put(
  protect,
  admin,
  upload.fields([{ name: 'logoIcon', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  [
    body('paymentGracePeriodDays', 'Payment grace period must be a number').optional().isNumeric(),
    body('taxRate', 'Tax rate must be a number').optional().isNumeric(),
    body('disconnectTime', 'Invalid disconnect time').optional().isIn(['expiry_time', 'end_of_day']),
  ],
  updateGeneralSettings
);
router.route('/mpesa').get(protect, admin, getMpesaSettings).put(
  protect,
  admin,
  [
    body('type', 'M-Pesa type (paybill or till) is required').isIn(['paybill', 'till']),
    body('data.consumerKey', 'Consumer Key is required').not().isEmpty(),
    body('data.consumerSecret', 'Consumer Secret is required').not().isEmpty(),
    body('data.passkey', 'Passkey is required').not().isEmpty(),
    body('data.paybillNumber', 'Paybill Number is required').if(body('type').equals('paybill')).not().isEmpty(),
    body('data.tillNumber', 'Till Number is required').if(body('type').equals('till')).not().isEmpty(),
  ],
  updateMpesaSettings
);
router.route('/mpesa/activate').post(
  protect,
  admin,
  [
    body('type', 'M-Pesa type (paybill or till) is required').isIn(['paybill', 'till']),
  ],
  activateMpesa
);

module.exports = router;