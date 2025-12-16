const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTechnicianActivity,
  getTechnicianActivities,
  getTechnicianActivityById,
  updateTechnicianActivity,
  deleteTechnicianActivity,
} = require('../controllers/technicianActivityController');
const { isSuperAdminOrAdmin } = require('../middlewares/authMiddleware');

router.route('/').post(
  isSuperAdminOrAdmin,
  [
    body('technician', 'Technician is required').not().isEmpty(),
    body('activityType', 'Activity type is required').isIn(['Installation', 'Support']),
    body('clientName', 'Client name is required').not().isEmpty(),
    body('clientPhone', 'Client phone number is required and must be valid').matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/),
    body('activityDate', 'Activity date is required and must be a valid date').isISO8601().toDate(),
    body('description', 'Description is required').not().isEmpty(),
    // Conditional validation for Installation
    body('installedEquipment', 'Installed equipment is required for Installation').if(body('activityType').equals('Installation')).not().isEmpty(),
    body('installationNotes', 'Installation notes are required for Installation').if(body('activityType').equals('Installation')).not().isEmpty(),
    // Conditional validation for Support
    body('issueDescription', 'Issue description is required for Support').if(body('activityType').equals('Support')).not().isEmpty(),
    body('solutionProvided', 'Solution provided is required for Support').if(body('activityType').equals('Support')).not().isEmpty(),
    body('supportCategory', 'Support category is required for Support').if(body('activityType').equals('Support')).isIn(['Client Problem', 'Building Issue']),
    body('building', 'Building ID is required for Building Issue support').if(body('supportCategory').equals('Building Issue')).isMongoId(),
  ],
  createTechnicianActivity
).get(isSuperAdminOrAdmin, getTechnicianActivities);
router
  .route('/:id')
  .get(isSuperAdminOrAdmin, getTechnicianActivityById)
  .put(isSuperAdminOrAdmin, updateTechnicianActivity)
  .delete(isSuperAdminOrAdmin, deleteTechnicianActivity);

module.exports = router;