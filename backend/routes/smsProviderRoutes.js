const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getSmsProviders,
    createSmsProvider,
    getSmsProviderById,
    updateSmsProvider,
    deleteSmsProvider,
    setActiveSmsProvider,
} = require('../controllers/smsProviderController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware'); // Assuming you have admin middleware

// All these routes should be protected and restricted to admins.
router.route('/')
    .get(isSuperAdminOrAdmin, getSmsProviders)
    .post(
        isSuperAdminOrAdmin,
        [
            body('name', 'Provider name is required').not().isEmpty(),
            body('providerType', 'Invalid provider type').isIn(['celcom', 'africastalking', 'twilio', 'generic_http']),
            body('credentials', 'Credentials are required').isObject(),
        ],
        createSmsProvider
    );

router.route('/:id')
    .get(isSuperAdminOrAdmin, getSmsProviderById)
    .put(isSuperAdminOrAdmin, updateSmsProvider)
    .delete(isSuperAdminOrAdmin, deleteSmsProvider);

router.route('/:id/set-active')
    .post(isSuperAdminOrAdmin, setActiveSmsProvider);

module.exports = router;
