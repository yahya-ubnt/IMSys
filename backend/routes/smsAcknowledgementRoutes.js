const express = require('express');
const router = express.Router();
const {
    getAcknowledgements,
    createAcknowledgement,
    getAcknowledgementById,
    updateAcknowledgement,
    deleteAcknowledgement
} = require('../controllers/smsAcknowledgementController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(isSuperAdminOrAdmin, getAcknowledgements)
    .post(isSuperAdminOrAdmin, createAcknowledgement);

router.route('/:id')
    .get(isSuperAdminOrAdmin, getAcknowledgementById)
    .put(isSuperAdminOrAdmin, updateAcknowledgement)
    .delete(isSuperAdminOrAdmin, deleteAcknowledgement);

module.exports = router;
