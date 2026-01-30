const express = require('express');
const router = express.Router();
const {
    getAcknowledgements,
    createAcknowledgement,
    getAcknowledgementById,
    updateAcknowledgement,
    deleteAcknowledgement
} = require('../controllers/smsAcknowledgementController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

router.route('/')
    .get(protect, isSuperAdminOrAdmin, getAcknowledgements)
    .post(protect, isSuperAdminOrAdmin, createAcknowledgement);

router.route('/:id')
    .get(protect, isSuperAdminOrAdmin, getAcknowledgementById)
    .put(protect, isSuperAdminOrAdmin, updateAcknowledgement)
    .delete(protect, isSuperAdminOrAdmin, deleteAcknowledgement);

module.exports = router;
