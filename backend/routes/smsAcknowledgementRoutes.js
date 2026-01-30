const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
    getAcknowledgements,
    createAcknowledgement,
    getAcknowledgementById,
    updateAcknowledgement,
    deleteAcknowledgement
} = require('../controllers/smsAcknowledgementController');
const { protect, isSuperAdminOrAdmin } = require('../middlewares/protect');

// Validation chains
const createValidation = [
    body('triggerType').trim().notEmpty().withMessage('Trigger type is required.'),
    body('smsTemplate').isMongoId().withMessage('A valid SMS template ID is required.'),
    body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be either "Active" or "Inactive".'),
    body('description').optional().trim()
];

const updateValidation = [
    body('triggerType').optional().trim().notEmpty().withMessage('Trigger type cannot be empty.'),
    body('smsTemplate').optional().isMongoId().withMessage('A valid SMS template ID must be provided.'),
    body('status').optional().isIn(['Active', 'Inactive']).withMessage('Status must be either "Active" or "Inactive".'),
    body('description').optional().trim()
];

const idParamValidation = [
    param('id').isMongoId().withMessage('Invalid ID format.')
];

router.route('/')
    .get(protect, isSuperAdminOrAdmin, getAcknowledgements)
    .post(protect, isSuperAdminOrAdmin, createValidation, createAcknowledgement);

router.route('/:id')
    .get(protect, isSuperAdminOrAdmin, idParamValidation, getAcknowledgementById)
    .put(protect, isSuperAdminOrAdmin, [...idParamValidation, ...updateValidation], updateAcknowledgement)
    .delete(protect, isSuperAdminOrAdmin, idParamValidation, deleteAcknowledgement);

module.exports = router;
